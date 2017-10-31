function show_vsphere_setting(value){
    if(value=="vsphere"){
        document.getElementById("vsphere_step_div").style.display="block";
        document.getElementById("host_worker_api_div").style.display="none";
        document.getElementById("host_create_button").style.display="none";
        document.getElementById("host_cancel_button").style.display="none";
        document.getElementById("vsphere_step_prev").style.display="inline-block";
        document.getElementById("vsphere_step_next").style.display="inline-block";
        document.getElementById("vc_address").style.display="inline-block";
        document.getElementById("vc_user").style.display="inline-block";
        document.getElementById("vc_password").style.display="inline-block";
        document.getElementById("vc_network").style.display="inline-block";
        document.getElementById("datastore").style.display="inline-block";
        document.getElementById("datacenter").style.display="inline-block";
        document.getElementById("cluster").style.display="inline-block";
        document.getElementById("vm_ip").style.display="inline-block";
        document.getElementById("vm_gateway").style.display="inline-block";
        document.getElementById("vm_netmask").style.display="inline-block";
        document.getElementById("vm_dns").style.display="inline-block";
        document.getElementById("vm_cpus").style.display="inline-block";
        document.getElementById("vm_memory").style.display="inline-block";
        document.getElementById("vm_template").style.display="inline-block";
        $("#vc_address").attr('disabled',false);
        $("#vc_user").attr('disabled',false);
        $("#vc_password").attr('disabled',false);
        $("#vc_network").attr('disabled',false);
        $("#datastore").attr('disabled',false);
        $("#datacenter").attr('disabled',false);
        $("#cluster").attr('disabled',false);
        $("#vm_ip").attr('disabled',false);
        $("#vm_gateway").attr('disabled',false);
        $("#vm_netmask").attr('disabled',false);
        $("#vm_dns").attr('disabled',false);
        $("#vm_cpus").attr('disabled',false);
        $("#vm_memory").attr('disabled',false);
        $("#vm_template").attr('disabled',false);
    }
    else{
        document.getElementById("vsphere_step_div").style.display="none";
        document.getElementById("host_worker_api_div").style.display="block";
        document.getElementById("host_create_button").style.display="inline-block";
        document.getElementById("host_cancel_button").style.display="inline-block";
        document.getElementById("vsphere_step_prev").style.display="none";
        document.getElementById("vsphere_step_next").style.display="none";
        document.getElementById("vc_address").style.display="none";
        document.getElementById("vc_user").style.display="none";
        document.getElementById("vc_password").style.display="none";
        document.getElementById("vc_network").style.display="none";
        document.getElementById("datastore").style.display="none";
        document.getElementById("datacenter").style.display="none";
        document.getElementById("cluster").style.display="none";
        document.getElementById("vm_ip").style.display="none";
        document.getElementById("vm_gateway").style.display="none";
        document.getElementById("vm_netmask").style.display="none";
        document.getElementById("vm_dns").style.display="none";
        document.getElementById("vm_cpus").style.display="none";
        document.getElementById("vm_memory").style.display="none";
        document.getElementById("vm_template").style.display="none";
        $("#vc_address").attr('disabled',true);
        $("#vc_user").attr('disabled',true);
        $("#vc_password").attr('disabled',true);
        $("#vc_network").attr('disabled',true);
        $("#datastore").attr('disabled',true);
        $("#datacenter").attr('disabled',true);
        $("#cluster").attr('disabled',true);
        $("#vm_ip").attr('disabled',true);
        $("#vm_gateway").attr('disabled',true);
        $("#vm_netmask").attr('disabled',true);
        $("#vm_dns").attr('disabled',true);
        $("#vm_cpus").attr('disabled',true);
        $("#vm_memory").attr('disabled',true);
        $("#vm_template").attr('disabled',true);
   }
}

var CurStep = 1;
function PrevClick(){
    if(CurStep == 2){
        CurStep = 1;
        document.getElementById("host_name_div").style.display="block";
        document.getElementById("other_setting_div").style.display="block";
        document.getElementById("vc_setting_div").style.display="none";
        document.getElementById("vm_setting_div").style.display="none";
        $("#vsphere-step2").removeClass("active");
        $("#vsphere-step1").addClass("active");
    }
    else if(CurStep == 3){
        CurStep = 2;
        document.getElementById("host_name_div").style.display="none";
        document.getElementById("other_setting_div").style.display="none";
        document.getElementById("vc_setting_div").style.display="block";
        document.getElementById("vm_setting_div").style.display="none";
        $("#vsphere-step3").removeClass("active");
        $("#vsphere-step2").addClass("active");
        document.getElementById("vsphere_step_next").style.display="inline-block";
        document.getElementById("host_create_button").style.display="none";
    }
}
function NextClick(){
    if(CurStep == 1){
       var hostnameLen=document.getElementById("host_name").value.length;
       if(hostnameLen > 0){
           CurStep = 2;
           document.getElementById("host_name_div").style.display="none";
           document.getElementById("other_setting_div").style.display="none";
           document.getElementById("vc_setting_div").style.display="block";
           document.getElementById("vm_setting_div").style.display="none";
           $("#vsphere-step1").removeClass("active");
           $("#vsphere-step2").addClass("active");
       }
    }
    else if(CurStep == 2){
        var vcAderessLen=document.getElementById("vc_address").value.length;
        var vcUserLen=document.getElementById("vc_user").value.length;
        var vcPassLen=document.getElementById("vc_password").value.length;
        var vcNetworkLen=document.getElementById("vc_network").value.length;
        var datastoreLen=document.getElementById("datastore").value.length;
        var datacenterLen=document.getElementById("datacenter").value.length;
        var clusterLen=document.getElementById("cluster").value.length;
        if(vcAderessLen && vcUserLen && vcPassLen && vcNetworkLen && datastoreLen && datacenterLen && clusterLen){
            CurStep = 3;
            document.getElementById("host_name_div").style.display="none";
            document.getElementById("other_setting_div").style.display="none";
            document.getElementById("vc_setting_div").style.display="none";
            document.getElementById("vm_setting_div").style.display="block";
            $("#vsphere-step2").removeClass("active");
            $("#vsphere-step3").addClass("active");
            document.getElementById("vsphere_step_next").style.display="none";
            document.getElementById("host_create_button").style.display="inline-block";
        }
    }
}

