angular.module('starter.settings',[])

.controller('SettingsCtrl', function($scope, $state, $ionicHistory, Service) {

  var db;
  var employeesHot;
  var employeesListDocId = "employeesList";

  var HEADERS = ["NAME", "SALARY"];

  var employeesTable = document.getElementById('employeesTable');

  $scope.print = function(){
    window.print();
  }  

  $scope.initDB = function(){
    db = new PouchDB('cauveryDB');
  }

  var getEmployees = function(){
    Service.getEmployeesData().then(function(response){
            
      $scope.employeesData = [
        HEADERS,       
      ];

      for(var i=0;i<response.length;i++){
        $scope.employeesData.push(response[i]);  
      }

      

     employeesHot.loadData($scope.employeesData);

    }).catch(function(){
      console.log('Err no data');
      setBlankTableData();
    });    
  } 


  var setBlankTableData = function(){


    employeesHot.loadData($scope.employeesData);
  }   

  $scope.init = function(){
    $scope.initDB();

    $scope.employeesData = [
      HEADERS,       
    ];

    employeesHot = new Handsontable(employeesTable, {
      data: $scope.employeesData,
      rowHeaders: true,
      colHeaders: true,
      filters: true,
      dropdownMenu: true,
    });    

    getEmployees();

  }

  $scope.gotoHome = function(){
    console.log('',$ionicHistory.goBack());

    if($ionicHistory.goBack()){
      $ionicHistory.goBack();
    }else{
      $state.go('dash');
    }


  }


  $scope.init(); 

  $scope.cancelAddNewEmployee = function(){
    $scope.addingNewEmployee = false;
  }

  $scope.addNewEmployee = function(){
    var newRow = [];
    $scope.employeesData.push(newRow);
    employeesHot.loadData($scope.employeesData);
  }

  $scope.save = function(){

      console.log('saving...',$scope.employeesData);

      db.get(employeesListDocId).then(function(doc) {

        console.log('docdocdoc',doc);

       db.put({
          _id: doc._id,
          _rev: doc._rev,
          employeesList: $scope.employeesData
        });


      }).then(function(response) {
        // handle response
        getEmployees();

      }).catch(function (err) {
        console.log('This err',err);

         db.put({
            _id: employeesListDocId,
            employeesList: $scope.employeesData      
          });

      });    

  }

  $scope.cancel = function(){
    
  }

  $scope.takeBackup = function(){

    db.allDocs({include_docs: true, attachments: true}).then(function(result){

      var link = document.createElement("a");
      link.download = "backup.json";
      var data = "text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(result));
      link.href = "data:" + data;
      link.click();
    });

  }



    $scope.loadFromBackup = function () {
      console.log('loadFromBackup');
      var file = document.getElementById("myFileInput").files[0];
      console.log('file',file);
      if (file) {
        $scope.noFileError = false;
        var aReader = new FileReader();
        aReader.readAsText(file, "UTF-8");
        aReader.onload = function (evt) {            
            var fileContent = aReader.result;

            var fileContentJson = JSON.parse(fileContent).rows;
            
            for(var i=0;i<fileContentJson.length;i++){
              var doc  = fileContentJson[i].doc;

              db.put(doc, {force: true}).then(function(res){
                console.log('res',res);
              }).then(function(err){
                console.log('err',err);
              })
            }

        }
        aReader.onerror = function (evt) {
          console.log('evt',evt);
            $scope.fileContent = "error";
        }
      }else{
        $scope.noFileError = true;
      }
    }


  $scope.deleteEmployeesTable = function(){

      db.get(employeesListDocId).then(function (doc) {
        return db.remove(doc);
      });    
  }  



});

