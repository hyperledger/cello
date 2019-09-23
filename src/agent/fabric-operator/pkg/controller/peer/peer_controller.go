package peer

import (
	"context"
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

	if len(foundService.Spec.Ports) > 0 && instance.Status.AccessPoint == "" {
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
		sts := r.newSTSForCR(secret, instance, request)
		reqLogger.Info("Creating a new set.", "StatefulSet.Namespace", sts.Namespace,
			"StatefulSet.Name", sts.Name)
		err = r.client.Create(context.TODO(), sts)
		if err != nil {
			reqLogger.Error(err, "Failed to create new statefulset for Peer.", "StatefulSet.Namespace",
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
		if cr.Spec.Certs != nil {
			// Add MSP certs as kubernetes secret
			for i, adminCert := range cr.Spec.Certs.Msp.AdminCerts {
				secret.Data["adminCert"+strconv.Itoa(i)] = []byte(adminCert)
			}
			for i, caCert := range cr.Spec.Certs.Msp.CaCerts {
				secret.Data["caCert"+strconv.Itoa(i)] = []byte(caCert)
			}
			secret.Data["keyStore"] = []byte(cr.Spec.Certs.Msp.KeyStore)
			secret.Data["signCerts"] = []byte(cr.Spec.Certs.Msp.SignCerts)
			for i, tlsCacerts := range cr.Spec.Certs.Msp.TLSCacerts {
				secret.Data["tlsCacerts"+strconv.Itoa(i)] = []byte(tlsCacerts)
			}
			// Add TLS certs as kubernetes secret
			value := ""
			for _, param := range cr.Spec.ConfigParams {
				if param.Name == "CORE_PEER_TLS_ENABLED" {
					value = param.Value
					break;
				}
			}
			if value != "" && value == "true" && cr.Spec.Certs.TLSCerts != nil {
				secret.Data["tlsKey"] = []byte(cr.Spec.Certs.TLSCerts.TLSPrivatekey)
				secret.Data["tlsCert"] = []byte(cr.Spec.Certs.TLSCerts.TLSCert)
				secret.Data["tlsRootcert"] = []byte(cr.Spec.Certs.TLSCerts.TLSRootcert)
			}
		}
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

// newPodForCR returns a fabric Peer statefulset with the same name/namespace as the cr
func (r *ReconcilePeer) newSTSForCR(secret *corev1.Secret, cr *fabricv1alpha1.Peer, request reconcile.Request) *appsv1.StatefulSet {
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
		containerEnvs := []corev1.EnvVar{}
		for _, e := range cr.Spec.ConfigParams {
			containerEnvs = append(containerEnvs, corev1.EnvVar{
				Name: e.Name, Value: e.Value,
			})
		}
		sts.Spec.Template.Spec.Containers[0].Image =
			fabric.GetDefault(cr.Spec.Image, "hyperledger/fabric-peer:1.4.1").(string)

		if secret != nil {
			sts.Spec.Template.Spec.Volumes[0].VolumeSource.Secret.SecretName = request.Name + "-secret"
			secretItems := []corev1.KeyToPath{}

			// Add MSP certificates
			for i, _ := range cr.Spec.Certs.Msp.AdminCerts {
				secretName := "adminCert"+strconv.Itoa(i)+".pem"
				secretItems = append(secretItems, corev1.KeyToPath{
					Key: secretName, Path: "/certs/msp/admincerts/" + secretName,
				})
			}

			for i, _ := range cr.Spec.Certs.Msp.CaCerts {
				secretName := "caCert"+strconv.Itoa(i)+".pem"
				secretItems = append(secretItems, corev1.KeyToPath{
					Key: secretName, Path: "/certs/msp/cacerts/" + secretName,
				})
			}

			secretItems = append(secretItems,
				corev1.KeyToPath{Key: "keyStore", Path: "/certs/msp/keystore"},
				corev1.KeyToPath{Key: "signCerts", Path: "/certs/msp/signCerts.pem"},
			)

			for i, _ := range cr.Spec.Certs.Msp.TLSCacerts {
				secretName := "tlsCacerts"+strconv.Itoa(i)+".pem"
				secretItems = append(secretItems, corev1.KeyToPath{
					Key: secretName, Path: "/certs/msp/tlscacerts/" + secretName,
				})
			}
			containerEnvs = append(containerEnvs,
				corev1.EnvVar{Name: "CORE_PEER_MSPCONFIGPATH", Value: "/certs/msp/"},
			)

			// Add tls certificates
			value := ""
			for _, param := range cr.Spec.ConfigParams {
				if param.Name == "CORE_PEER_TLS_ENABLED" {
					value = param.Value
					break;
				}
			}
			if value != "" && value == "true" && cr.Spec.Certs.TLSCerts != nil {
				secretItems = append(secretItems,
					corev1.KeyToPath{Key: "tlsKey", Path: "/certs/tls/server.key"},
					corev1.KeyToPath{Key: "tlsCert", Path: "/certs/tls/server.crt"},
					corev1.KeyToPath{Key: "tlsRootcert", Path: "/certs/tls/ca.crt"},
				)
				containerEnvs = append(containerEnvs,
					corev1.EnvVar{Name: "CORE_PEER_TLS_CERT_FILE", Value: "/certs/tls/server.key"},
					corev1.EnvVar{Name: "CORE_PEER_TLS_KEY_FILE", Value: "/certs/tls/server.crt"},
					corev1.EnvVar{Name: "CORE_PEER_TLS_ROOTCERT_FILE", Value: "/certs/tls/ca.crt"},
				)
			}

			sts.Spec.Template.Spec.Volumes[0].VolumeSource.Secret.Items = secretItems
		}

		sts.Spec.Template.Spec.Containers[0].Env = containerEnvs
		sts.Spec.Template.Spec.Containers[0].Resources = cr.Spec.Resources
		controllerutil.SetControllerReference(cr, sts, r.scheme)
	}
	return sts
}
