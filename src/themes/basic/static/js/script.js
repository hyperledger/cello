$(document).ready(function () {
  $('.table_sorted').DataTable(
    {}
  );

  function alertMsg(title, message, type) {
    $.notify({
      title: '<strong>' + title + '</strong>',
      message: message
    }, {
      type: type,
      delay: 2000,
      placement: {
        align: 'center'
      }
    });
  }

  $('.create_host_button').click(function () {
    //var name = $(this).parents('form:first').find('[name="name"]').val();
    //var daemon_url = $(this).parents('form:first').find('[name="daemon_url"]').val();
    var form_data = $('#add_new_host_form').serialize();

    $.ajax({
      url: "/api/host",
      type: 'POST',
      dataType: 'json',
      data: form_data,
      success: function (response) {
        console.log(response);
        $('#newHostModal').hide();
        alertMsg('Success!', 'New host is created.', 'success');
        setTimeout("location.reload(true);", 2000);
      },
      error: function (error) {
        console.log(error);
        $('#newHostModal').hide();
        alertMsg('Failed!', error.responseJSON.error, 'danger');
        setTimeout("location.reload(true);", 2000);
      }
    });
  });

  $('#newHostModal').on('shown.bs.modal', function (e) {
    var selected = $("#newHostModal #log_type option:selected").text();
    console.log("initial selection:" + selected);
    $('#newHostModal #log_type').change(function () {
      selected = $("#newHostModal #log_type option:selected").text().toUpperCase();
      console.log(selected);
      if (selected == 'LOCAL') {
        $('#newHostModal #log_server').hide(200);
      } else {
        $('#newHostModal #log_server').show(200);
      }
    })
  });

  $('.host_action_fillup').click(function (e) {
    var id = $(this).data('id');
    console.log('fillup clicked with id=' + id);
    $.ajax({
      url: "/api/host_op",
      type: 'POST',
      dataType: 'json',
      data: {
        "id": id,
        "action": "fillup"
      },
      success: function (response) {
        console.log(response);
        setTimeout(function () {
          alertMsg('Success!', 'The host is fullfilled now.', 'success');
        }, 1000);

        setTimeout("location.reload(true);", 2000);
      },
      error: function (error) {
        console.log(error);
        alertMsg('Failed!', error.responseJSON.error, 'danger');
        setTimeout(location.reload, 2000);
      }
    });
    e.preventDefault();
  });
  $('.host_action_clean').click(function (e) {
    var id = $(this).data('id');
    $.ajax({
      url: "/api/host_op",
      type: 'POST',
      dataType: 'json',
      data: {
        "id": id,
        "action": "clean"
      },
      success: function (response) {
        console.log(response);
        alertMsg('Success!', 'The host is clean now, autofill disabled.', 'success');
        setTimeout("location.reload(true);", 2000);
      },
      error: function (error) {
        console.log(error);
        alertMsg('Failed!', error.responseJSON.error, 'danger');
        setTimeout("location.reload(true);", 2000);
      }
    });
    e.preventDefault();
  });
  $('.host_action_config').click(function (e) {
    var id = $(this).data('id');
    $.ajax({
      url: '/api/host/'+id,
      method: 'GET',
      dataType: 'json',
    }).success(function (response) {
      // Populate the form fields with the data returned from server
      host = response.data;
      $('#config_host_form')
        .find('[name="id"]').val(host.id).end()
        .find('[name="name"]').val(host.name).end()
        .find('[name="daemon_url"]').val(host.daemon_url).end()
        .find('[name="type"]').val(host.type).end()
        .find('[name="log_level"]').val(host.log_level).end()
        .find('[name="log_type"]').val(host.log_type).end()
        .find('[name="log_server"]').val(host.log_server).end()
        .find('[name="capacity"]').val(host.capacity).end()
        .find('[name="status"]').val(host.status).end()
        .find('[name="create_ts"]').val(host.create_ts).end()
        .find('[name="clusters"]').val(host.clusters.length).end();

      if (host.schedulable == "true")
        $('#config_host_form').find('[name="schedulable"]').prop('checked', true);
      else
        $('#config_host_form').find('[name="schedulable"]').prop('checked', false);
      if (host.autofill == "true")
        $('#config_host_form').find('[name="autofill"]').prop('checked', true);
      else
        $('#config_host_form').find('[name="autofill"]').prop('checked', false);
      // Show the dialog
      bootbox
        .dialog({
          title: 'Edit the Host Config',
          message: $('#config_host_form'),
          show: false // We will show it manually later
        })
        .on('shown.bs.modal', function () {
          var selected = host.log_type.toUpperCase();
          //console.log(selected);
          if (selected == 'LOCAL') {
            $('#config_host_form #log_server').hide(200);
          } else {
            $('#config_host_form #log_server').show(200);
          }
          $('#config_host_form #log_type').change(function () {
            selected = $("#config_host_form #log_type option:selected").text().toUpperCase();
            console.log(selected);
            if (selected == 'LOCAL') {
              $('#config_host_form #log_server').hide(200);
            } else {
              $('#config_host_form #log_server').show(200);
            }
          });
          $('#config_host_form').show();
        })
        .on('hide.bs.modal', function (e) {
          // Bootbox will remove the modal (including the body which contains the login form)
          // after hiding the modal
          // Therefor, we need to backup the form
          $('#config_host_form').hide().appendTo('body');
        })
        .modal('show');
    });
    e.preventDefault();
  });

  $('#reset_host_confirm_modal').on('click', '.btn-ok', function (e) {
    var $modalDiv = $(e.delegateTarget);
    var id = $(this).data('hostId');
    // $.ajax({url: '/api/record/' + id, type: 'DELETE'})
    // $.post('/api/record/' + id).then()
    $.ajax({
      url: "/api/host_op",
      type: 'POST',
      dataType: 'json',
      data: {
        "id": id,
        "action": "reset"
      },
      success: function (response) {
        console.log(response);
        alertMsg('Success!', 'The host is reset now.', 'success');
        setTimeout("location.reload(true);", 2000);
      },
      error: function (error) {
        console.log(error);
        alertMsg('Failed!', error.responseJSON.error, 'danger');
        setTimeout("location.reload(true);", 2000);
      }
    });
    $modalDiv.modal('hide');
  });
  $('#reset_host_confirm_modal').on('show.bs.modal', function (e) {
    var data = $(e.relatedTarget).data();
    $('#title', this).text(data.title);
    $('.btn-ok', this).data('hostId', data.id);
  });

  $('#delete_host_confirm_modal').on('click', '.btn-ok', function (e) {
    var $modalDiv = $(e.delegateTarget);
    var id = $(this).data('hostId');
    $.ajax({
      url: "/api/host",
      type: 'DELETE',
      dataType: 'json',
      data: {
        "id": id
      },
      success: function (response) {
        console.log(response);
        alertMsg('Success!', 'The host is deleted.', 'success');
        setTimeout("location.reload(true);", 2000);
      },
      error: function (error) {
        console.log(error);
        alertMsg('Failed!', error.responseJSON.error, 'danger');
        setTimeout("location.reload(true);", 2000);
      }
    });
    $modalDiv.modal('hide');
  });
  $('#delete_host_confirm_modal').on('show.bs.modal', function (e) {
    var data = $(e.relatedTarget).data();
    $('#title', this).text(data.title);
    $('.btn-ok', this).data('hostId', data.id);
  });
  $('#save_host_button').click(function (e) {
    // Save the form data via an Ajax request
    e.preventDefault();
    var $form = $('#config_host_form');

    var id = $form.find('[name="id"]').val();
    var name = $form.find('[name="name"]').val();
    var status = $form.find('[name="status"]').val();
    var capacity = $form.find('[name="capacity"]').val();
    var type = $form.find('[name="type"]').val();
    if ($form.find('[name="schedulable"]').is(':checked')) {
      var schedulable = true
    } else {
      var schedulable = false
    }
    if ($form.find('[name="autofill"]').is(':checked')) {
      var autofill = true
    } else {
      var autofill = false
    }
    var log_level = $form.find('[name="log_level"]').val();
    var log_type = $form.find('[name="log_type"]').val();
    var log_server = $form.find('[name="log_server"]').val();

    // The url and method might be different in your application
    $.ajax({
      url: '/api/host',
      method: 'PUT',
      data: {
        "id": id,
        "name": name,
        "status": status,
        "capacity": capacity,
        "log_level": log_level,
        "log_type": log_type,
        "log_server": log_server,
        "type": type,
        "autofill": autofill,
        "schedulable": schedulable
      }
    }).success(function (response) {
      // Get the cells
      host = response.data
      var $button = $('button[data-id="' + host.id + '"]'),
        $tr = $button.closest('tr'),
        $cells = $tr.find('td');

      // Update the cell data
      $cells
        .eq(1).html(host.name).end()
        .eq(3).html(host.capacity).end();

      // Hide the dialog
      $form.parents('.bootbox').modal('hide');

      //bootbox.alert('The Host config is updated');
      alertMsg('Success!', 'The host info is updated.', 'success');
      setTimeout("location.reload(true);", 2000);
    }).error(function (response) {
      // Hide the dialog
      $form.parents('.bootbox').modal('hide');
      alertMsg('Failed!', error.responseJSON.error, 'danger');
      setTimeout("location.reload(true);", 2000);
    });
  });

  $('.create_cluster_button').click(function () {
    var form_data = $('#add_new_cluster_form').serialize();

    $.ajax({
      url: "/api/cluster",
      type: 'POST',
      dataType: 'json',
      data: form_data,
      success: function (response) {
        console.log(response);
        $('#newClusterModal').hide();
        alertMsg('Success!', 'New cluster is created.', 'success');
        setTimeout("location.reload(true);", 2000);
        //location.reload();
      },
      error: function (error) {
        console.log(error);
        $('#newClusterModal').hide();
        alertMsg('Failed!', error.responseJSON.error, 'danger');
        setTimeout("location.reload(true);", 2000);
        //location.reload();
      }
    });
  });

  $('#newClusterModal').on('shown.bs.modal', function (e) {
    var selected = $("#newClusterModal #consensus_plugin option:selected").text();
    $('#newClusterModal #consensus_plugin').change(function () {
      selected = $("#newClusterModal #consensus_plugin option:selected").text().toUpperCase();
      console.log(selected);
      if (selected == 'NOOPS') {
        $('#newClusterModal #form_consensus_mode').hide(200);
      } else {
        $('#newClusterModal #form_consensus_mode').show(200);
      }
    })
  });

  //$('.delete_cluster_button').click(function() {
  $('#table_clusters').on('click', '.delete_cluster_button', function () {
    // Confirm
    var data_id = $(this).attr('data-id');
    var col_name = $(this).attr('data-col_name');
    console.log("Deleting" + data_id);

    $.ajax({
      url: "/api/cluster",
      type: 'DELETE',
      dataType: 'json',
      data: {
        "id": data_id,
        "col_name": col_name
      },
      success: function (response) {
        console.log(response);
        alertMsg('Success!', 'The cluster is deleted.', 'success');
        setTimeout("location.reload(true);", 2000);
      },
      error: function (error) {
        console.log(error);
        alertMsg('Failed!', error.responseJSON.error, 'danger');
        setTimeout("location.reload(true);", 2000);
      }
    });
  });

$('.chain_action_start').on('click', function (e) {
    var id = $(this).data('id');
    console.log('start clicked with id=' + id);
    $.ajax({
      url: "/api/cluster_op",
      type: 'POST',
      dataType: 'json',
      data: {
        "cluster_id": id,
        "action": "start"
      },
      success: function (response) {
        console.log(response);
        setTimeout(function () {
          alertMsg('Success!', 'The chain is started now.', 'success');
        }, 1000);

        setTimeout("location.reload(true);", 2000);
      },
      error: function (error) {
        console.log(error);
        alertMsg('Failed!', error.responseJSON.error, 'danger');
        setTimeout(location.reload, 2000);
      }
    });
    e.preventDefault();
  });

  $('.chain_action_stop').on('click', function (e) {
    var id = $(this).data('id');
    console.log('start clicked with id=' + id);
    $.ajax({
      url: "/api/cluster_op",
      type: 'POST',
      dataType: 'json',
      data: {
        "cluster_id": id,
        "action": "stop"
      },
      success: function (response) {
        console.log(response);
        setTimeout(function () {
          alertMsg('Success!', 'The chain is stopped now.', 'success');
        }, 1000);

        setTimeout("location.reload(true);", 2000);
      },
      error: function (error) {
        console.log(error);
        alertMsg('Failed!', error.responseJSON.error, 'danger');
        setTimeout(location.reload, 2000);
      }
    });
    e.preventDefault();
  });

$('.chain_action_restart').on('click', function (e) {
    var id = $(this).data('id');
    console.log('start clicked with id=' + id);
    $.ajax({
      url: "/api/cluster_op",
      type: 'POST',
      dataType: 'json',
      data: {
        "cluster_id": id,
        "action": "restart"
      },
      success: function (response) {
        console.log(response);
        setTimeout(function () {
          alertMsg('Success!', 'The chain is restarted now.', 'success');
        }, 1000);

        setTimeout("location.reload(true);", 2000);
      },
      error: function (error) {
        console.log(error);
        alertMsg('Failed!', error.responseJSON.error, 'danger');
        setTimeout(location.reload, 2000);
      }
    });
    e.preventDefault();
  });

  $('.chain_action_delete').on('click', function (e) {
    var id = $(this).data('id');
    var col_name = $(this).data('col_name');
    console.log('start clicked with id=' + id);
    $.ajax({
      url: "/api/cluster",
      type: 'DELETE',
      dataType: 'json',
      data: {
        "id": id,
        "col_name": col_name
      },
      success: function (response) {
        console.log(response);
        setTimeout(function () {
          alertMsg('Success!', 'Delete chain successfully.', 'success');
        }, 1000);

        setTimeout("location.reload(true);", 2000);
      },
      error: function (error) {
        console.log(error);
        alertMsg('Failed!', error.responseJSON.error, 'danger');
        setTimeout(location.reload, 2000);
      }
    });
    e.preventDefault();
  });

  $('.chain_action_release').on('click', function (e) {
    var id = $(this).data('id');
    console.log('release clicked with id=' + id);
    $.ajax({
      url: "/api/cluster_op",
      type: 'POST',
      dataType: 'json',
      data: {
        "cluster_id": id,
        "action": "release"
      },
      success: function (response) {
        console.log(response);
        setTimeout(function () {
          alertMsg('Success!', 'Release chain successfully.', 'success');
        }, 1000);

        setTimeout("location.reload(true);", 2000);
      },
      error: function (error) {
        console.log(error);
        alertMsg('Failed!', error.responseJSON.error, 'danger');
        setTimeout(location.reload, 2000);
      }
    });
    e.preventDefault();
  });

  //not used yet
  $('.release_cluster_button').click(function () {
    var id_data = $(this).attr('id_data');

    $.ajax({
      url: "/api/cluster",
      type: 'POST',
      dataType: 'json',
      data: {
        "id": id_data,
        "col_name": col_name
      },
      success: function (response) {
        console.log(response);
        location.reload();
      },
      error: function (error) {
        console.log(error);
        location.reload();
      }
    });
  });


  Highcharts.setOptions({
    global: {
      useUTC: false
    }
  });

  // Create the chart
  $('#container_test').highcharts({
    chart: {
      type: 'bar'
    },
    title: {
      text: 'Fruit Consumption'
    },
    xAxis: {
      categories: ['Apples', 'Bananas', 'Oranges']
    },
    yAxis: {
      title: {
        text: 'Fruit eaten'
      }
    },
    series: [{
      name: 'Jane',
      data: [1, 0, 4]
    }, {
      name: 'John',
      data: [5, 7, 3]
    }]
  });

  var gaugeOptions = {

    chart: {
      type: 'solidgauge'
    },

    title: null,

    pane: {
      center: ['50%', '85%'],
      size: '140%',
      startAngle: -90,
      endAngle: 90,
      background: {
        backgroundColor: (Highcharts.theme && Highcharts.theme.background2) || '#EEE',
        innerRadius: '60%',
        outerRadius: '100%',
        shape: 'arc'
      }
    },

    tooltip: {
      enabled: false
    },

    // the value axis
    yAxis: {
      stops: [
        [0.1, '#55BF3B'], // green
        [0.5, '#DDDF0D'], // yellow
        [0.9, '#DF5353'] // red
      ],
      lineWidth: 0,
      minorTickInterval: null,
      tickPixelInterval: 400,
      tickWidth: 0,
      title: {
        y: -70
      },
      labels: {
        y: 16
      }
    },

    plotOptions: {
      solidgauge: {
        dataLabels: {
          y: 5,
          borderWidth: 0,
          useHTML: true
        }
      }
    }
  };

  // The speed gauge
  $('#container_host_utilization').highcharts(Highcharts.merge(gaugeOptions, {
    yAxis: {
      min: 0,
      max: 200,
      title: {
        text: 'Utilization'
      }
    },

    credits: {
      enabled: false
    },

    series: [{
      name: 'Utilization',
      data: [80],
      dataLabels: {
        format: '<div style="text-align:center"><span style="font-size:25px;color:' +
        ((Highcharts.theme && Highcharts.theme.contrastTextColor) || 'black') + '">{y}</span><br/>' +
        '<span style="font-size:12px;color:silver">km/h</span></div>'
      },
      tooltip: {
        valueSuffix: ''
      }
    }]

  }));

  // The RPM gauge
  $('#container-rpm').highcharts(Highcharts.merge(gaugeOptions, {
    yAxis: {
      min: 0,
      max: 5,
      title: {
        text: 'RPM'
      }
    },

    series: [{
      name: 'RPM',
      data: [1],
      dataLabels: {
        format: '<div style="text-align:center"><span style="font-size:25px;color:' +
        ((Highcharts.theme && Highcharts.theme.contrastTextColor) || 'black') + '">{y:.1f}</span><br/>' +
        '<span style="font-size:12px;color:silver">* 1000 / min</span></div>'
      },
      tooltip: {
        valueSuffix: ' revolutions/min'
      }
    }]

  }));


  function request_hosts() {
    $.ajax({
      url: '/api/stat?res=host',
      type: 'GET',
      dataType: 'json',
      success: function (response) {
        // add the point
        chart_hosts_type.series[0].setData(response.type);
        chart_hosts_status.series[0].setData(response.status);

        // call it again after one second
        setTimeout(request_hosts, 30000);
      },
      cache: false
    });
  }

  var chart_hosts_type = new Highcharts.Chart({
    chart: {
      renderTo: 'stat_hosts_type',
      defaultSeriesType: 'spline',
      plotBackgroundColor: null,
      plotBorderWidth: null,
      plotShadow: false,
      type: 'pie',
      events: {
        load: request_hosts
      }
    },
    title: {
      text: 'Host Type'
    },
    tooltip: {
      pointFormat: '<b>{point.y}</b>'
    },
    plotOptions: {
      pie: {
        allowPointSelect: true,
        cursor: 'pointer',
        dataLabels: {
          enabled: false
        },
        showInLegend: true
      }
    },
    legend: {
      labelFormatter: function () {
        return this.name + ': ' + this.y;
      },
    },
    series: [{
      name: 'Number',
      colorByPoint: true,
      data: [{
        name: '',
        y: 100
      }]
    }]
  });
  var chart_hosts_status = new Highcharts.Chart({
    chart: {
      renderTo: 'stat_hosts_status',
      defaultSeriesType: 'spline',
      plotBackgroundColor: null,
      plotBorderWidth: null,
      plotShadow: false,
      type: 'pie',
      events: {
        load: request_hosts
      }
    },
    title: {
      text: 'Host Status'
    },
    tooltip: {
      pointFormat: '<b>{point.y}</b>'
    },
    plotOptions: {
      pie: {
        allowPointSelect: true,
        cursor: 'pointer',
        dataLabels: {
          enabled: false
        },
        showInLegend: true
      }
    },
    legend: {
      labelFormatter: function () {
        return this.name + ': ' + this.y;
      },
    },
    series: [{
      name: 'Number',
      colorByPoint: true,
      data: [{
        name: '',
        y: 100
      }]
    }]
  });

  function request_clusters() {
    $.ajax({
      url: '/api/stat?res=cluster',
      type: 'GET',
      dataType: 'json',
      success: function (response) {
        // add the point
        chart_clusters_type.series[0].setData(response.type);
        chart_clusters_status.series[0].setData(response.status);

        // call it again after 30 second
        setTimeout(request_clusters, 30000);
      },
      cache: false
    });
  }

  var chart_clusters_type = new Highcharts.Chart({
    chart: {
      renderTo: 'stat_clusters_type',
      defaultSeriesType: 'spline',
      plotBackgroundColor: null,
      plotBorderWidth: null,
      plotShadow: false,
      type: 'pie',
      events: {
        load: request_clusters
      }
    },
    title: {
      text: 'Chain Type'
    },
    tooltip: {
      pointFormat: '<b>{point.y}</b>'
    },
    plotOptions: {
      pie: {
        allowPointSelect: true,
        cursor: 'pointer',
        dataLabels: {
          enabled: false
        },
        showInLegend: true
      }
    },
    legend: {
      labelFormatter: function () {
        return this.name + ': ' + this.y;
      },
    },
    series: [{
      name: 'Number',
      colorByPoint: true,
      data: [{
        name: '',
        y: 100
      }]
    }]
  });
  var chart_clusters_status = new Highcharts.Chart({
    chart: {
      renderTo: 'stat_clusters_status',
      defaultSeriesType: 'spline',
      plotBackgroundColor: null,
      plotBorderWidth: null,
      plotShadow: false,
      type: 'pie',
      events: {
        load: request_clusters
      }
    },
    title: {
      text: 'Chain Status'
    },
    tooltip: {
      pointFormat: '<b>{point.y}</b>'
    },
    plotOptions: {
      pie: {
        allowPointSelect: true,
        cursor: 'pointer',
        dataLabels: {
          enabled: false
        },
        showInLegend: true
      }
    },
    legend: {
      labelFormatter: function () {
        return this.name + ': ' + this.y;
      },
    },
    series: [{
      name: 'Number',
      colorByPoint: true,
      data: [{
        name: '',
        y: 100
      }]
    }]
  });
});
