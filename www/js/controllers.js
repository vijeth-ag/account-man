angular.module('starter.controllers', ['ionic-datepicker'])

.controller('DashCtrl', function($scope, $state, Service, ionicDatePicker, $ionicPopup) {

  var db;

  var hot;

  $scope.currentSelectedDate = new Date();

  var dataTable = document.getElementById('dataTable');

  var datePickerObj = {
    callback: function (val) {  //Mandatory          
      $scope.currentSelectedDate = new Date(val);
      $scope.loadDataByDate();

    },
    closeOnSelect: true,
  };

  var NAME = 0, CASH = 1, DEPOSIT = 2 , CHEQUE = 3, EXTRA = 4, TOTAL = 5;

  var HEADERS = ["NAME", "CASH", "DEPOSIT", "CHEQUE", "EXTRA", "TOTAL", "COMPUTE", "DIFF", "SIGNATURE"];

  $scope.print = function(){
    window.print();
  }

  $scope.init = function(){

    $scope.initDB();

    $scope.data = [
      HEADERS,
    ];

    
    hot = new Handsontable(dataTable, {
      data: $scope.data,
      rowHeaders: true,
      colHeaders: true,
      filters: true,
      dropdownMenu: true
    });

    var hotCellChangesCallback = function(changes){
      console.log('changes',changes);
    }

    Handsontable.hooks.add('afterChange', hotCellChangesCallback);

    $scope.loadDataByDate();

  }

  $scope.initDB = function(){
    db = new PouchDB('cauveryDB');
  }

  
  $scope.openDatePicker = function(){
    ionicDatePicker.openDatePicker(datePickerObj);
  };

  $scope.previousDate = function(){
    $scope.currentSelectedDate.setDate($scope.currentSelectedDate.getDate() - 1);
    $scope.loadDataByDate();

  }

  $scope.nextDate = function(){
   $scope.currentSelectedDate.setDate($scope.currentSelectedDate.getDate() + 1); 
   $scope.loadDataByDate();
  }

  $scope.addRow = function(){

    removeGrandTotalRow();

    var newR = [];

    $scope.data.push(newR);
    hot.loadData($scope.data);
  }

  $scope.addColoumn = function(){    

    var newColoumn = " "

    $scope.data[0].push(newColoumn);

    hot.loadData($scope.data);
  }

  var afterSelectionCallback = function(row, col){
    console.log('afterSelectionCallback',row);
    $scope.selectedRow = row;
  }

  Handsontable.hooks.add('afterSelection', afterSelectionCallback, hot);

  $scope.deleteRow = function(){

       var confirmPopup = $ionicPopup.confirm({
           title: 'Delete Row',
           template: 'Are you sure?'
        });

        confirmPopup.then(function(res) {
           if(res) {
              
              $scope.data.splice($scope.selectedRow, 1);
              $scope.save();

           } else {
              // do nothing
           }
        })    



}

  $scope.setBlankTableData = function(){
        $scope.data = [
          HEADERS,       
        ];

        var employees;

      Service.getEmployees().then(function(response){

        employees = response;

        for(var i=0;i<employees.length;i++){
          $scope.data.push([employees[i]]);  
        }

        hot.loadData($scope.data);  

      });         

  }

  $scope.loadDataByDate = function(){

    var id = getDateForDB($scope.currentSelectedDate);

    db.get(id.toString()).then(function (doc) {
      $scope.data = doc.data;

        var currentRowDepositTotal = 0;
        var currentRowCashTotal = 0;
        var currentRowChequeTotal = 0;
        var currentRowExtraTotal = 0;

        var currentRowGrandTotal = 0;        

        for(var i=1;i<$scope.data.length;i++){
          var currentRow = $scope.data[i];
          
          var currentRowDeposit = parseInt(currentRow[DEPOSIT]);
          var currentRowCash = parseInt(currentRow[CASH]);
          var currentRowCheque = parseInt(currentRow[CHEQUE]);
          var currentRowExtra = parseInt(currentRow[EXTRA]);

          currentRowDeposit = currentRowDeposit ? currentRowDeposit : 0;
          currentRowCash = currentRowCash ? currentRowCash : 0;
          currentRowCheque = currentRowCheque ? currentRowCheque : 0;
          currentRowExtra = currentRowExtra ? currentRowExtra : 0;

          currentRowDepositTotal += currentRowDeposit ? currentRowDeposit : 0;
          currentRowCashTotal += currentRowCash ? currentRowCash : 0;
          currentRowChequeTotal += currentRowCheque ? currentRowCheque : 0;
          currentRowExtraTotal += currentRowExtra ? currentRowExtra : 0;

          $scope.data[i][TOTAL] =  currentRowDeposit + currentRowCash + currentRowCheque + currentRowExtra;

          currentRowGrandTotal +=   $scope.data[i][TOTAL];    
      }

        var grandTotal = ["Grand Total", currentRowCashTotal, currentRowDepositTotal, currentRowChequeTotal, currentRowExtraTotal, currentRowGrandTotal];

        $scope.data.push(grandTotal);

        hot.loadData($scope.data);

        for(var i=0;i<$scope.data.length;i++){
          // row, col
          hot.setCellMeta(i, TOTAL, 'readOnly', true);                    
        }        

        for(var i=0;i<$scope.data[$scope.data.length-1].length;i++){
          // row, col
          hot.setCellMeta($scope.data.length-1, i, 'readOnly', true);                    
        }        

        hot.render();

    }).catch(function (err) {
      $scope.setBlankTableData();
    });


  }

  var getDateForDB = function(givenDate){
      var dateForDB = givenDate.getDate().toString() + givenDate.getMonth().toString() + givenDate.getFullYear().toString();
      return "transactions_"+dateForDB;
  }

  $scope.gotoSettings = function(){
    $state.go('settings');
  }

  $scope.gotoSalary = function(){
    $state.go('salary');
  }

  $scope.gotoExpenses = function(){
    $state.go('expenses');
  }


  $scope.cancel = function(){
    $scope.loadDataByDate();
  }

  $scope.deleteTodaysData = function(){

    var id = getDateForDB($scope.currentSelectedDate);

      db.get(id.toString()).then(function (doc) {
        return db.remove(doc);
      });    
  }



  $scope.save = function(){    
      
      removeGrandTotalRow();

      var id = getDateForDB($scope.currentSelectedDate);

      db.get(id.toString()).then(function(doc) {

       db.put({
          _id: doc._id,
          _rev: doc._rev,
          data: $scope.data  
        });


      }).then(function(response) {
        $scope.loadDataByDate();
      }).catch(function (err) {
        console.log(err);

       db.put({
          _id: id.toString(),
          data: $scope.data      
        });

      });    


  }


    var removeGrandTotalRow = function(){

      if($scope.data[$scope.data.length-1][0] == "Grand Total"){
        $scope.data.pop();
      }      

    }


$scope.init(); 
});

