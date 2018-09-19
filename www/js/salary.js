angular.module('starter.salary', [])

.controller('SalaryCtrl', function($scope, $state, $q, Service) {

  var db;

  var salaryHot;

  $scope.currentSelectedDate = new Date();

  $scope.showSalarySummary = true;
  $scope.showSalaryDetailsTable = false;

  var NAME = 0, SALARY = 1, ADV_PAID = 2, SALARY_DUE = 3, NEW_PAYMENT = 4, MODE = 5;

  var HEADERS = ["NAME", "SALARY", "ADV. PAID", "SALARY DUE", "NEW PAYMENT", "MODE"];

  var salaryDataTable = document.getElementById('salaryDataTable');

  $scope.print = function(){
    window.print();
  }

  $scope.init = function(){
    $scope.initDB();

    $scope.SalaryData = [
      HEADERS,
    ];

    
    salaryHot = new Handsontable(salaryDataTable, {
      data: $scope.SalaryData,
      rowHeaders: true,
      colHeaders: true,
      filters: true,
      dropdownMenu: true,
      columns:[
      {},{},{},{},{},
      {
        type: 'dropdown',
        source: ['CASH', 'CHEQUE', 'TRASNSFER']
      }      

      ]
    });


    var hotCellChangesCallback = function(changes){
      
    }

    Handsontable.hooks.add('afterChange', hotCellChangesCallback);


    $scope.loadDataByMonth();
  }

  $scope.gotoTransactions = function(){
    $state.go('dash')
  }  

  $scope.gotoExpenses = function(){
    $state.go('expenses');
  }  

  $scope.gotoSettings = function(){
    $state.go('settings');
  }

  $scope.initDB = function(){
    db = new PouchDB('cauveryDB');
  }

  $scope.previousMonth = function(){
    $scope.currentSelectedDate.setDate($scope.currentSelectedDate.getDate() - 30);
    $scope.loadDataByMonth();
  }

  $scope.nextMonth = function(){
   $scope.currentSelectedDate.setDate($scope.currentSelectedDate.getDate() + 30); 
   $scope.loadDataByMonth();
  }

  $scope.loadDataByMonth = function(){

    console.log('loadDataByMonth');

    var id = getMonthForDB($scope.currentSelectedDate);

    db.get(id).then(function (doc) {
        $scope.SalaryData = doc.data;

        console.log('SSD',$scope.SalaryData);

        for(var i=1;i<$scope.SalaryData.length;i++){
          var currentEmployee = $scope.SalaryData[i];

          var currentEmployeeSalary = parseInt(currentEmployee[SALARY]);
          var currentEmployeeAdvPaid = parseInt(currentEmployee[ADV_PAID]);
          var currentEmployeeSalaryDue = parseInt(currentEmployee[SALARY_DUE]);
          var currentEmployeeNewPayment = parseInt(currentEmployee[NEW_PAYMENT]);


          currentEmployeeAdvPaid = currentEmployeeAdvPaid ? currentEmployeeAdvPaid : 0;

          currentEmployeeSalaryDue = currentEmployeeSalaryDue ? currentEmployeeSalaryDue : "";

          currentEmployeeNewPayment = currentEmployeeNewPayment ? currentEmployeeNewPayment : 0;

          currentEmployeeAdvPaid += currentEmployeeNewPayment;

          currentEmployeeSalaryDue = currentEmployeeSalary - currentEmployeeAdvPaid;

          currentEmployeeNewPayment = "";

          var calculatedRow = [ currentEmployee[NAME], currentEmployeeSalary, currentEmployeeAdvPaid, currentEmployeeSalaryDue, currentEmployeeNewPayment]

          console.log('currentEmployeeSalary',currentEmployeeSalary);
          console.log('currentEmployeeAdvPaid',currentEmployeeAdvPaid);
          console.log('currentEmployeeSalaryDue',currentEmployeeSalaryDue);
          console.log('currentEmployeeNewPayment',currentEmployeeNewPayment);

          $scope.SalaryData[i] = calculatedRow;

        }
        
        salaryHot.loadData($scope.SalaryData);
        $scope.lockCells();
    }).catch(function (err) {
      setBlankTableData();
    });

    

  }

  $scope.lockCells = function(){

      for(var i=0;i<$scope.SalaryData.length;i++){
        // row, col
        for(var j=0;j<$scope.SalaryData[i].length-1;j++){
              salaryHot.setCellMeta(i, j, 'readOnly', true);
        }                 
      }         

      salaryHot.render();

  }

  $scope.addEntry = function(salaryDataRow){

        if(salaryDataRow[NEW_PAYMENT]){
          if(!salaryDataRow[MODE]){
            alert("Please Select MODE");
            return;
          }
          console.log('Name',salaryDataRow[NAME]);
          console.log('AMT',salaryDataRow[NEW_PAYMENT]);
          console.log('Mode',salaryDataRow[MODE]);
          console.log('getMonthForDB',getMonthForDB($scope.currentSelectedDate));

          var entry = {};
          entry["name"] = salaryDataRow[NAME];
          entry["amount"] = salaryDataRow[NEW_PAYMENT];
          entry["mode"] = salaryDataRow[MODE];
          entry["date"] = new Date().getDate().toString()+"_"+ new Date().getMonth().toString() +"_" + new Date().getFullYear().toString();

          var docid = salaryDataRow[NAME]+"_"+getMonthForDB($scope.currentSelectedDate);

            db.get(docid.toString()).then(function(doc) {

            console.log('doc',doc);

            var currentEntries = doc.currentEntries;

            currentEntries.push(entry);
            
             db.put({
                _id: doc._id,
                _rev: doc._rev,
                currentEntries: currentEntries 
              });

            }).then(function(response) {
                console.log('write dpne');
            }).catch(function (err) {
              console.log(err);

             var currentEntries = []; 
             var entries = [];
             entries.push(entry); 

             db.put({
                _id: docid.toString(),
                currentEntries: entries  
              });

            }); 

        }
  }

  $scope.saveSalaryDetail = function(){

      var promises = [];
      
      var deferred = $q.defer();

      for(var i=1;i<$scope.SalaryData.length;i++){
          promises.push($scope.addEntry($scope.SalaryData[i]));
      }

      $q.all(promises).then(function(){
        console.log('all done');
        deferred.resolve();
      });


      return deferred.promise;

  }

  $scope.save = function(){

      $scope.saveSalaryDetail().then(function(){
            var id = getMonthForDB($scope.currentSelectedDate);
            db.get(id.toString()).then(function(doc) {

             db.put({
                _id: doc._id,
                _rev: doc._rev,
                data: $scope.SalaryData  
              });

            }).then(function(response) {
              $scope.loadDataByMonth();
            }).catch(function (err) {
              console.log(err);

             db.put({
                _id: id.toString(),
                data: $scope.SalaryData      
              });

            });  

      })


  }

  $scope.cancel = function(){
    $scope.loadDataByMonth();
  }

  var setBlankTableData = function(){
        $scope.SalaryData = [
          HEADERS,       
        ];

        var employees;

      Service.getEmployeesData().then(function(response){
        employees = response;

        $scope.SalaryData = [
          HEADERS,       
        ];

        for(var i=0;i<response.length;i++){
          $scope.SalaryData.push(response[i]);  
        }

        salaryHot.loadData($scope.SalaryData);  

      });         

  }

  var getMonthForDB = function(givenDate){
      var dateForDB = givenDate.getMonth().toString() + givenDate.getFullYear().toString();
      return "salary_"+dateForDB.toString();
  }  

  $scope.showSalaryDetails = function(){
    $scope.showSalarySummary = $scope.showSalarySummary ? false : true;
    $scope.showSalaryDetailsTable = $scope.showSalaryDetailsTable ? false : true;


    if($scope.showSalaryDetailsTable){

      Service.getEmployees().then(function(response){
        console.log('res',response);
        $scope.employees = response; 
      }); 

    }

  }


  $scope.showSalaryDetailsFor = function(employee) {
      var docid = employee + "_" + getMonthForDB($scope.currentSelectedDate);
      db.get(docid.toString()).then(function(doc) {
          $scope.showSalaryDetailsForEmployee = doc.currentEntries;
          $scope.$apply();
      }).catch(function(err) {
          console.log(err);
      });
  }



  $scope.deleteThisMonthsData = function(){
    var id = getMonthForDB($scope.currentSelectedDate);

      db.get(id.toString()).then(function (doc) {
        return db.remove(doc);
      });     
  }
  
  $scope.init(); 


});

