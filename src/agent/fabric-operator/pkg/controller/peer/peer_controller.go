package peer

import (
	"context"
	"crypto/x509"
	"encoding/base64"
	"encoding/pem"
	"strconv"

	fabric "github.com/hyperledger/cello/src/agent/fabric-operator/pkg/apis/fabric"
	fabricv1alpha1 "github.com/hyperledger/cello/src/agent/fabric-operator/pkg/apis/fabric/v1alpha1"
	appsv1 "k8s.io/api/apps/v1"
	corev1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/api/errors"

	"k8s.io/apimachinery/pkg/api/resource"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/types"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/controller-runtime/pkg/controller"
	"sigs.k8s.io/controller-runtime/pkg/controller/controllerutil"
	"sigs.k8s.io/controller-runtime/pkg/handler"
	"sigs.k8s.io/controller-runtime/pkg/manager"
	"sigs.k8s.io/controller-runtime/pkg/reconcile"
	logf "sigs.k8s.io/controller-runtime/pkg/runtime/log"
	"sigs.k8s.io/controller-runtime/pkg/source"
)

var log = logf.Log.WithName("controller_peer")

/**
* USER ACTION REQUIRED: This is a scaffold file intended for the user to modify with their own Controller
* business logic.  Delete these comments after modifying this file.*
 */

// Add creates a new Peer Controller and adds it to the Manager. The Manager will set fields on the Controller
// and Start it when the Manager is Started.
func Add(mgr manager.Manager) error {
	return add(mgr, newReconciler(mgr))
}

// newReconciler returns a new reconcile.Reconciler
func newReconciler(mgr manager.Manager) reconcile.Reconciler {
	return &ReconcilePeer{client: mgr.GetClient(), scheme: mgr.GetScheme()}
}

// add adds a new Controller to mgr with r as the reconcile.Reconciler
func add(mgr manager.Manager, r reconcile.Reconciler) error {
	// Create a new controller
	c, err := controller.New("peer-controller", mgr, controller.Options{Reconciler: r})
	if err != nil {
		return err
	}

	// Watch for changes to primary resource Peer
	err = c.Watch(&source.Kind{Type: &fabricv1alpha1.Peer{}}, &handler.EnqueueRequestForObject{})
	if err != nil {
		return err
	}

	// Watch for changes to stateful set that we create
	err = c.Watch(&source.Kind{Type: &appsv1.StatefulSet{}}, &handler.EnqueueRequestForOwner{
		IsController: true,
		OwnerType:    &fabricv1alpha1.CA{},
	})
	if err != nil {
		return err
	}

	// Watch for changes to secret that we create
	err = c.Watch(&source.Kind{Type: &corev1.Secret{}}, &handler.EnqueueRequestForOwner{
		IsController: true,
		OwnerType:    &fabricv1alpha1.CA{},
	})
	if err != nil {
		return err
	}

	// Watch for changes to services that we create
	err = c.Watch(&source.Kind{Type: &corev1.Service{}}, &handler.EnqueueRequestForOwner{
		IsController: true,
		OwnerType:    &fabricv1alpha1.CA{},
	})
	if err != nil {
		return err
	}

	return nil
}

// blank assignment to verify that ReconcilePeer implements reconcile.Reconciler
var _ reconcile.Reconciler = &ReconcilePeer{}

// ReconcilePeer reconciles a Peer object
type ReconcilePeer struct {
	// This client, initialized using mgr.Client() above, is a split client
	// that reads objects from the cache and writes to the apiserver
	client client.Client
	scheme *runtime.Scheme
}

// Reconcile reads that state of the cluster for a Peer object and makes changes based on the state read
// and what is in the Peer.Spec
// TODO(user): Modify this Reconcile function to implement your Controller logic.  This example creates
// a Pod as an example
// Note:
// The Controller will requeue the Request to be processed again if the returned error is non-nil or
// Result.Requeue is true, otherwise upon completion it will remove the work from the queue.
func (r *ReconcilePeer) Reconcile(request reconcile.Request) (reconcile.Result, error) {
	reqLogger := log.WithValues("Request.Namespace", request.Namespace, "Request.Name", request.Name)
	reqLogger.Info("Reconciling Peer")

	err := fabric.CheckAndCreateConfigMap(r.client, request)
	if err != nil {
		reqLogger.Error(err, "Failed to find Fabric configuration, can not continue!")
		return reconcile.Result{}, err
	}

	// Fetch the Peer instance
	instance := &fabricv1alpha1.Peer{}
	err = r.client.Get(context.TODO(), request.NamespacedName, instance)
	if err != nil {
		if errors.IsNotFound(err) {
			// Request object not found, could have been deleted after reconcile request.
			// Owned objects are automatically garbage collected. For additional cleanup logic use finalizers.
			// Return and don't requeue
			reqLogger.Info("Peer resource not found. Ignoring since object must be deleted.")
			return reconcile.Result{}, nil
		}
		// Error reading the object - requeue the request.
		reqLogger.Error(err, "Failed to get Peer.")
		return reconcile.Result{}, err
	}

	secret := &corev1.Secret{}
	secretID := request.Name + "-secret"
	foundSecret := &corev1.Secret{}
	err = r.client.Get(context.TODO(),
		types.NamespacedName{Name: secretID, Namespace: request.Namespace},
		foundSecret)
	if err != nil && errors.IsNotFound(err) {
		secret = r.newSecretForCR(instance, request)
		err = r.client.Create(context.TODO(), secret)
		if err != nil {
			reqLogger.Error(err, "Failed to retrieve Fabric Peer secrets")
			return reconcile.Result{}, err
		}
		// When we reach here, it means that we have created the secret successfully
		// and ready to do more
	}

	foundService := &corev1.Service{}
	err = r.client.Get(context.TODO(), request.NamespacedName, foundService)
	if err != nil && errors.IsNotFound(err) {
		// Define a new Service object
		service := r.newServiceForCR(instance, request)
		reqLogger.Info("Creating a new service.", "Service.Namespace", service.Namespace,
			"Service.Name", service.Name)
		err = r.client.Create(context.TODO(), service)
		if err != nil {
			reqLogger.Error(err, "Failed to create new service for Peer.", "Service.Namespace",
				service.Namespace, "Service.Name", service.Name)
			return reconcile.Result{}, err
		}
		r.client.Get(context.TODO(), request.NamespacedName, foundService)
	} else if err != nil {
		reqLogger.Error(err, "Failed to get Peer service.")
		return reconcile.Result{}, err
	}

	if len(foundService.Spec.Ports) == 0 {
		// if no ports yet, we need to wait.
		return reconcile.Result{Requeue: true}, nil
	}

	if instance.Status.AccessPoint == "" {
		if foundService.Spec.Ports[0].NodePort > 0 {
			reqLogger.Info("The service port has been found", "Service port", foundService.Spec.Ports[0].NodePort)
			r.client.Get(context.TODO(), request.NamespacedName, instance)

			allHostIPs, _ := fabric.GetNodeIPaddress(r.client)
			publicIPs := append(instance.Spec.Hosts, allHostIPs...)

			if len(publicIPs) > 0 {
				// Got some public IPs, set access point accordingly
				instance.Status.AccessPoint = "https://" + publicIPs[0] + ":" +
					strconv.FormatInt(int64(foundService.Spec.Ports[0].NodePort), 10)
			} else {
				// Not getting any public accessible IPs, only expose port
				instance.Status.AccessPoint =
					strconv.FormatInt(int64(foundService.Spec.Ports[0].NodePort), 10)
			}
			err = r.client.Status().Update(context.TODO(), instance)
			if err != nil {
				reqLogger.Error(err, "Failed to update Peer status", "Fabric Peer namespace",
					instance.Namespace, "Fabric Peer Name", instance.Name)
				return reconcile.Result{}, err
			}
		} else {
			return reconcile.Result{Requeue: true}, nil
		}
	}

	foundSTS := &appsv1.StatefulSet{}
	err = r.client.Get(context.TODO(), request.NamespacedName, foundSTS)
	if err != nil && errors.IsNotFound(err) {
		// Define a new StatefulSet object
		sts := r.newSTSForCR(instance, request)
		reqLogger.Info("Creating a new set.", "StatefulSet.Namespace", sts.Namespace,
			"StatefulSet.Name", sts.Name)
		err = r.client.Create(context.TODO(), sts)
		if err != nil && !errors.IsAlreadyExists(err) {
			reqLogger.Error(err, "Failed creating new statefulset for Peer.", "StatefulSet.Namespace",
				sts.Namespace, "StatefulSet.Name", sts.Name)
			return reconcile.Result{}, err
		}
	} else if err != nil {
		reqLogger.Error(err, "Failed to get Peer StatefulSet.")
		return reconcile.Result{}, err
	}

	return reconcile.Result{}, nil
}

// newSecretForCR returns k8s secret with the name + "-secret" /namespace as the cr
func (r *ReconcilePeer) newSecretForCR(cr *fabricv1alpha1.Peer, request reconcile.Request) *corev1.Secret {
	obj, _, _ := fabric.GetObjectFromTemplate("peer/peer_secret.yaml")
	secret, ok := obj.(*corev1.Secret)
	if !ok {
		secret = nil
	} else {
		secret.Name = request.Name + "-secret"
		secret.Namespace = request.Namespace
		secret.Data = make(map[string][]byte)

		if cr.Spec.AdminCerts == nil || len(cr.Spec.AdminCerts) == 0 ||
			cr.Spec.CaCerts == nil || len(cr.Spec.CaCerts) == 0 ||
			len(cr.Spec.KeyStore) == 0 || len(cr.Spec.SignCerts) == 0 ||
			cr.Spec.TLSCacerts == nil || len(cr.Spec.TLSCacerts) == 0 ||
			len(cr.Spec.TLS.TLSCert) == 0 || len(cr.Spec.TLS.TLSKey) == 0 {
			log.Error(errors.NewBadRequest("All entries under MSP and TLS in the request are required."),
				"Orderer creation", "Provide all certs under msp and tls in the request")
			return nil
		}

		for i, adminCert := range cr.Spec.AdminCerts {
			secret.Data["admincert"+strconv.Itoa(i)], _ = base64.StdEncoding.DecodeString(adminCert)
		}
		for i, caCert := range cr.Spec.CaCerts {
			secret.Data["cacert"+strconv.Itoa(i)], _ = base64.StdEncoding.DecodeString(caCert)
		}
		secret.Data["keystore"], _ = base64.StdEncoding.DecodeString(cr.Spec.KeyStore)
		secret.Data["signcert"], _ = base64.StdEncoding.DecodeString(cr.Spec.SignCerts)
		// Try to find the organization name to be used as mspid
		block, _ := pem.Decode(secret.Data["signcert"])
		secret.Data["mspid"] = []byte("SampleOrgMSPID")
		if block != nil {
			cert, err := x509.ParseCertificate(block.Bytes)
			if err != nil {
				log.Error(err, "Failed to parse certificate")
			} else {
				if len(cert.Subject.Organization) > 0 {
					secret.Data["mspid"] = []byte(cert.Subject.Organization[0])
				} else if len(cert.Issuer.Organization) > 0 {
					secret.Data["mspid"] = []byte(cert.Issuer.Organization[0])
				}
			}
		}
		for i, tlsCacerts := range cr.Spec.TLSCacerts {
			secret.Data["tlscacert"+strconv.Itoa(i)], _ = base64.StdEncoding.DecodeString(tlsCacerts)
		}

		secret.Data["tlscert"], _ = base64.StdEncoding.DecodeString(cr.Spec.TLS.TLSCert)
		secret.Data["tlskey"], _ = base64.StdEncoding.DecodeString(cr.Spec.TLS.TLSKey)
		controllerutil.SetControllerReference(cr, secret, r.scheme)
	}
	return secret
}

// newServiceForCR returns a fabric Peer service with the same name/namespace as the cr
func (r *ReconcilePeer) newServiceForCR(cr *fabricv1alpha1.Peer, request reconcile.Request) *corev1.Service {
	obj, _, _ := fabric.GetObjectFromTemplate("peer/peer_service.yaml")
	service, ok := obj.(*corev1.Service)
	if !ok {
		service = nil
	} else {
		service.Name = request.Name
		service.Namespace = request.Namespace
		service.Labels["k8s-app"] = service.Name
		service.Spec.Selector["k8s-app"] = service.Name
		controllerutil.SetControllerReference(cr, service, r.scheme)
	}
	return service
}

// newStatefulSetForCR returns a fabric Peer statefulset with the same name/namespace as the cr
func (r *ReconcilePeer) newSTSForCR(cr *fabricv1alpha1.Peer, request reconcile.Request) *appsv1.StatefulSet {
	obj, _, err := fabric.GetObjectFromTemplate("peer/peer_statefulset.yaml")
	if err != nil {
		log.Error(err, "Failed to load statefulset.")
	}
	sts, ok := obj.(*appsv1.StatefulSet)
	if !ok {
		sts = nil
	} else {
		sts.Name = request.Name
		sts.Namespace = request.Namespace
		sts.Spec.ServiceName = sts.Name
		sts.Spec.Selector.MatchLabels["k8s-app"] = sts.Name
		storageClassName := fabric.GetDefault(cr.Spec.StorageClass, "default").(string)
		sts.Spec.VolumeClaimTemplates[0].Spec.StorageClassName = &storageClassName
		storageSize := fabric.GetDefault(cr.Spec.StorageSize, "5Gi").(string)
		sts.Spec.VolumeClaimTemplates[0].Spec.Resources.Requests["storage"] = resource.MustParse(storageSize)
		sts.Spec.Template.Labels["k8s-app"] = sts.Name
		sts.Spec.Template.Spec.Containers[0].Image =
			fabric.GetDefault(cr.Spec.Image, "hyperledger/fabric-peer:1.4.3").(string)
		sts.Spec.Template.Spec.Volumes[0].VolumeSource.Secret.SecretName = request.Name + "-secret"
		sts.Spec.Template.Spec.Containers[0].Env[0].ValueFrom.SecretKeyRef.Name = request.Name + "-secret"

		containerEnvs := sts.Spec.Template.Spec.Containers[0].Env
		if len(cr.Status.AccessPoint) > 9 {
			ep := string(cr.Status.AccessPoint[8:len(cr.Status.AccessPoint)])
			containerEnvs = append(containerEnvs,
				corev1.EnvVar{Name: "CORE_PEER_GOSSIP_EXTERNALENDPOINT", Value: ep})
		}
		for _, e := range cr.Spec.ConfigParams {
			containerEnvs = append(containerEnvs, corev1.EnvVar{
				Name: e.Name, Value: e.Value,
			})
		}

		sts.Spec.Template.Spec.Containers[0].Env = containerEnvs
		sts.Spec.Template.Spec.Containers[0].Resources = cr.Spec.Resources
		controllerutil.SetControllerReference(cr, sts, r.scheme)
	}
	return sts
}
