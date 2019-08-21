package ca

import (
	"context"
	"strconv"
	"strings"
	"time"

	fabric "github.com/hyperledger/cello/src/agent/fabric-operator/pkg/apis/fabric"
	fabricv1alpha1 "github.com/hyperledger/cello/src/agent/fabric-operator/pkg/apis/fabric/v1alpha1"
	appsv1 "k8s.io/api/apps/v1"
	corev1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/api/errors"
	"k8s.io/apimachinery/pkg/api/resource"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/types"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/controller-runtime/pkg/controller"
	"sigs.k8s.io/controller-runtime/pkg/controller/controllerutil"
	"sigs.k8s.io/controller-runtime/pkg/handler"
	"sigs.k8s.io/controller-runtime/pkg/manager"
	"sigs.k8s.io/controller-runtime/pkg/reconcile"
	logf "sigs.k8s.io/controller-runtime/pkg/runtime/log"
	"sigs.k8s.io/controller-runtime/pkg/source"
)

var log = logf.Log.WithName("controller_ca")

/**
* USER ACTION REQUIRED: This is a scaffold file intended for the user to modify with their own Controller
* business logic.  Delete these comments after modifying this file.*
 */

// Add creates a new CA Controller and adds it to the Manager. The Manager will set fields on the Controller
// and Start it when the Manager is Started.
func Add(mgr manager.Manager) error {
	return add(mgr, newReconciler(mgr))
}

// newReconciler returns a new reconcile.Reconciler
func newReconciler(mgr manager.Manager) reconcile.Reconciler {
	return &ReconcileCA{client: mgr.GetClient(), scheme: mgr.GetScheme(), kubeconfig: mgr.GetConfig()}
}

// add adds a new Controller to mgr with r as the reconcile.Reconciler
func add(mgr manager.Manager, r reconcile.Reconciler) error {
	// Create a new controller
	c, err := controller.New("ca-controller", mgr, controller.Options{Reconciler: r})
	if err != nil {
		return err
	}

	// Watch for changes to primary resource CA
	err = c.Watch(&source.Kind{Type: &fabricv1alpha1.CA{}}, &handler.EnqueueRequestForObject{})
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

// blank assignment to verify that ReconcileCA implements reconcile.Reconciler
var _ reconcile.Reconciler = &ReconcileCA{}

// ReconcileCA reconciles a CA object
type ReconcileCA struct {
	// This client, initialized using mgr.Client() above, is a split client
	// that reads objects from the cache and writes to the apiserver
	client     client.Client
	scheme     *runtime.Scheme
	kubeconfig *rest.Config
}

// Reconcile reads that state of the cluster for a CA object and makes changes based on the state read
// and what is in the CA.Spec
// TODO(user): Modify this Reconcile function to implement your Controller logic.  This example creates
// a Pod as an example
// Note:
// The Controller will requeue the Request to be processed again if the returned error is non-nil or
// Result.Requeue is true, otherwise upon completion it will remove the work from the queue.
func (r *ReconcileCA) Reconcile(request reconcile.Request) (reconcile.Result, error) {
	reqLogger := log.WithValues("Request.Namespace", request.Namespace, "Request.Name", request.Name)
	reqLogger.Info("Reconciling Fabric CA")

	err := fabric.CheckAndCreateConfigMap(r.client, request)
	if err != nil {
		reqLogger.Error(err, "Failed to find Fabric configuration, can not continue!")
		return reconcile.Result{}, err
	}

	// Fetch the CA instance
	instance := &fabricv1alpha1.CA{}
	err = r.client.Get(context.TODO(), request.NamespacedName, instance)
	if err != nil {
		if errors.IsNotFound(err) {
			// Request object not found, could have been deleted after reconcile request.
			// Owned objects are automatically garbage collected. For additional cleanup logic use finalizers.
			// Return and don't requeue
			reqLogger.Info("Fabric CA resource not found. Ignoring since object must be deleted.")
			return reconcile.Result{}, nil
		}
		// Error reading the object - requeue the request.
		reqLogger.Error(err, "Failed to get Fabric CA.")
		return reconcile.Result{}, err
	}

	secretID := request.Name + "-secret"
	foundSecret := &corev1.Secret{}
	err = r.client.Get(context.TODO(),
		types.NamespacedName{Name: secretID, Namespace: request.Namespace},
		foundSecret)
	if err != nil && errors.IsNotFound(err) {
		secret := r.newSecretForCR(instance, request)
		err = r.client.Create(context.TODO(), secret)
		if err != nil {
			reqLogger.Error(err, "Failed to retrieve Fabric CA secrets")
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
			reqLogger.Error(err, "Failed to create new service for CA.", "Service.Namespace",
				service.Namespace, "Service.Name", service.Name)
			return reconcile.Result{}, err
		}
		// Create the service ok, try to get its ports
		r.client.Get(context.TODO(), request.NamespacedName, foundService)
	} else if err != nil {
		reqLogger.Error(err, "Failed to get CA service.")
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
				instance.Status.AccessPoint = "https://:" + publicIPs[0] + ":" +
					strconv.FormatInt(int64(foundService.Spec.Ports[0].NodePort), 10)
			} else {
				// Not getting any public accessible IPs, only expose port
				instance.Status.AccessPoint =
					strconv.FormatInt(int64(foundService.Spec.Ports[0].NodePort), 10)
			}
			err = r.client.Status().Update(context.TODO(), instance)
			if err != nil {
				reqLogger.Error(err, "Failed to update CA status", "Fabric CA namespace",
					instance.Namespace, "Fabric CA Name", instance.Name)
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
		if err != nil {
			reqLogger.Error(err, "Failed to create new statefulset for CA.", "StatefulSet.Namespace",
				sts.Namespace, "StatefulSet.Name", sts.Name)
			return reconcile.Result{}, err
		}
	} else if err != nil {
		reqLogger.Error(err, "Failed to get CA StatefulSet.")
		return reconcile.Result{}, err
	}

	return reconcile.Result{}, nil
}

// newSecretForCR returns k8s secret with the name + "-secret" /namespace as the cr
func (r *ReconcileCA) newSecretForCR(cr *fabricv1alpha1.CA, request reconcile.Request) *corev1.Secret {
	obj, _, _ := fabric.GetObjectFromTemplate("ca/ca_secret.yaml")
	secret, ok := obj.(*corev1.Secret)
	if !ok {
		secret = nil
	} else {
		secret.Name = request.Name + "-secret"
		secret.Namespace = request.Namespace
		if cr.Spec.Certs != nil {
			secret.Data["cert"] = []byte(cr.Spec.Certs.Cert)
			secret.Data["key"] = []byte(cr.Spec.Certs.Key)
			secret.Data["tlsCert"] = []byte(cr.Spec.Certs.TLSCert)
			secret.Data["tlsKey"] = []byte(cr.Spec.Certs.TLSKey)
		}
		controllerutil.SetControllerReference(cr, secret, r.scheme)
	}
	return secret
}

// newServiceForCR returns a fabric CA service with the same name/namespace as the cr
func (r *ReconcileCA) newServiceForCR(cr *fabricv1alpha1.CA, request reconcile.Request) *corev1.Service {
	obj, _, _ := fabric.GetObjectFromTemplate("ca/ca_service.yaml")
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

// newPodForCR returns a fabric CA statefulset with the same name/namespace as the cr
func (r *ReconcileCA) newSTSForCR(cr *fabricv1alpha1.CA, request reconcile.Request) *appsv1.StatefulSet {
	obj, _, err := fabric.GetObjectFromTemplate("ca/ca_statefulset.yaml")
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
			fabric.GetDefault(cr.Spec.Image, "hyperledger/fabric-ca:1.4.1").(string)
		sts.Spec.Template.Spec.Volumes[0].VolumeSource.Secret.SecretName = request.Name + "-secret"

		sts.Spec.Template.Spec.InitContainers[0].Env[4].Value = cr.Spec.Admin
		sts.Spec.Template.Spec.InitContainers[0].Env[5].Value = cr.Spec.AdminPassword
		clusterIPs, _ := fabric.GetNodeIPaddress(r.client)
		cr.Spec.Hosts = append(cr.Spec.Hosts, clusterIPs...)
		hosts := "[" + strings.Join(cr.Spec.Hosts, ",") + "]"
		sts.Spec.Template.Spec.InitContainers[0].Env =
			append(sts.Spec.Template.Spec.InitContainers[0].Env,
				corev1.EnvVar{Name: "FCO_HOSTS", Value: hosts},
			)

		sts.Spec.Template.Spec.Containers[0].Resources = cr.Spec.Resources
		sts.Spec.Template.Spec.Containers[0].Env[1].Value = request.Name
		for _, configParam := range cr.Spec.ConfigParams {
			sts.Spec.Template.Spec.Containers[0].Env =
				append(sts.Spec.Template.Spec.Containers[0].Env, corev1.EnvVar{
					Name: configParam.Name, Value: configParam.Value,
				})
		}

		if cr.Spec.Certs != nil {
			sts.Spec.Template.Spec.Containers[0].Env =
				append(sts.Spec.Template.Spec.Containers[0].Env,
					corev1.EnvVar{Name: "FABRIC_CA_SERVER_CA_KEYFILE", Value: "/certs/key"},
					corev1.EnvVar{Name: "FABRIC_CA_SERVER_CA_CERTFILE", Value: "/certs/cert"},
					corev1.EnvVar{Name: "FABRIC_CA_SERVER_TLS_KEYFILE", Value: "/certs/tlsKey"},
					corev1.EnvVar{Name: "FABRIC_CA_SERVER_TLS_CERTFILE", Value: "/certs/tlsCert"},
				)
		}

		controllerutil.SetControllerReference(cr, sts, r.scheme)
	}
	return sts
}

func (r *ReconcileCA) getCerts(request reconcile.Request) string {

	kubeclient := kubernetes.NewForConfigOrDie(r.kubeconfig)
	if kubeclient == nil {
		log.Info("The client is empty", "the name space is ", request.Namespace, "the name is ", request.Name)
	} else {
		timeout, _ := time.ParseDuration("30s")
		execRequest := kubeclient.CoreV1().RESTClient().Post().Resource("pods").Timeout(timeout).
			Name(request.Name+"-0").Namespace(request.Namespace).SubResource("exec").
			Param("container", "ca").Param("command", "ls").Param("stdin", "false").
			Param("stdout", "false").Param("stderr", "false").Param("tty", "false")
		result := execRequest.Do()
		if result.Error() != nil {
			log.Error(result.Error(), "Execution failed", "request.Namespace", request.Namespace, "request.Name", request.Name)
			return ""
		}

		buf, _ := result.Raw()
		log.Info("The content of the exec result is ", string(buf))
		log.Info("The client is not empty", "the name space is ", request.Namespace, "the name is ", request.Name)
		return string(buf)
	}
	return ""
}
