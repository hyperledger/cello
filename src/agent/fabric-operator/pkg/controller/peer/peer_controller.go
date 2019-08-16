e package peer

import (
	"context"

	fabric "github.com/hyperledger/cello/src/agent/fabric-operator/pkg/apis/fabric"
	fabricv1alpha1 "github.com/hyperledger/cello/src/agent/fabric-operator/pkg/apis/fabric/v1alpha1"
	appsv1 "k8s.io/api/apps/v1"
	corev1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/api/errors"

	//metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/api/resource"
	"k8s.io/apimachinery/pkg/runtime"
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

	// TODO(user): Modify this to be the types you create that are owned by the primary resource
	// Watch for changes to secondary resource Pods and requeue the owner Peer
	err = c.Watch(&source.Kind{Type: &corev1.Pod{}}, &handler.EnqueueRequestForOwner{
		IsController: true,
		OwnerType:    &fabricv1alpha1.Peer{},
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
	err := r.client.Get(context.TODO(), request.NamespacedName, instance)
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
	} else if err != nil {
		reqLogger.Error(err, "Failed to get Peer service.")
		return reconcile.Result{}, err
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

// newServiceForCR returns a fabric Peer service with the same name/namespace as the cr
func (r *ReconcilePeer) newServiceForCR(cr *fabricv1alpha1.Peer, request reconcile.Request) *corev1.Service {
	obj, _, _ := fabric.GetObjectFromTemplate("peer/peer_service.json")
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
func (r *ReconcilePeer) newSTSForCR(cr *fabricv1alpha1.Peer, request reconcile.Request) *appsv1.StatefulSet {
	obj, _, err := fabric.GetObjectFromTemplate("peer/peer_statefulset.json")
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
			fabric.GetDefault(cr.Spec.Image, "hyperledger/fabric-peer:1.4.1").(string)
		containerEnvs := []corev1.EnvVar{}
		for _, e := range cr.Spec.ConfigParams {
			envName := e.Name
			envValue := e.Value
			env := corev1.EnvVar{
				Name:  envName,
				Value: envValue,
			}
			containerEnvs = append(containerEnvs, env)
		}
		sts.Spec.Template.Spec.Containers[0].Env = containerEnvs
		controllerutil.SetControllerReference(cr, sts, r.scheme)
	}
	return sts
}
