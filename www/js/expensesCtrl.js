angular.module('starter.expenses', ['ionic-datepicker'])

.controller('ExpensesCtrl', function($scope, $state, $q, Service, ionicDatePicker) {

  var db;

  var expensesHot, summaryHot, denominationsHot, expensesSummaryHot;

  $scope.currentSelectedDate = new Date();

  var NAME = 0, AMOUNT = 1, NOTES = 2;

  var  TRANSACTIONS_CASH = 1;

  var HEADERS = ["NAME", "AMOUNT","NOTES"];

  var denominations = ["2000 X", "1000 X", "500 X", "200 X", "100 X", "50 X", "20 X", "10 X"]

  var commonExpenseTypes = ["Stationery", "Unloading", "Water", "Meals", "Salary", "Incentive", "Diesel", "Tea/Snacks", "Cleaning", "INT", "Courier", "CA", "Miscellaneous", "Advance"]

  var EXPENSES_SUMMARY_HEADERS = ["NAME", "AMOUNT"];

  var expensesDataTable = document.getElementById('expensesDataTable');
  var todaysSummaryDataTable = document.getElementById('todaysSummaryDataTable');
  var expensesSummaryDataTable = document.getElementById('expensesSummaryDataTable');
  var denominationsDataTable = document.getElementById('denominationsDataTable');

  var fromDatePickerObj, toDatePickerObj;

  var expensesReports ;

  var RangeData = [];

  $scope.showFooter = true;

  var datePickerObj = {
    callback: function (val) {  //Mandatory          
      $scope.currentSelectedDate = new Date(val);
      $scope.loadDataByDate();

    },
    closeOnSelect: true,
  };

  $scope.print = function(){
    window.print();
  }  

  $scope.init = function(){
    $scope.initDB();

    $scope.dateType = "bySingleDate";

    $scope.ExpensesData = [
      HEADERS,
    ];

    expensesHot = new Handsontable(expensesDataTable, {
      data: $scope.ExpensesData,
      rowHeaders: true,
      colHeaders: true,
      filters: true,
      dropdownMenu: true
    });

    $scope.DenominationsData = [];

    for(var i=0;i<denominations.length;i++){
      var row = [denominations[i], ""];      
      $scope.DenominationsData.push(row)
    }

    denominationsHot = new Handsontable(denominationsDataTable, {
      data: $scope.DenominationsData,
      filters: true,
      dropdownMenu: true,
    });
   
    $scope.loadDataByDate();
    
    var hotCellChangesCallback = function(changes){
      console.log('awdchanges',changes);
    }

    Handsontable.hooks.add('afterChange', hotCellChangesCallback);
  }

  $scope.generateExpensesReport = function(){

    if(!$scope.fromDate || !$scope.toDate){
      console.log('alert');
      alert('Please select From and To Dates');
      return;
    }

    if(expensesSummaryHot){
      expensesSummaryHot.loadData([]);  
    }
    

    RangeData = [];

    var resultArray = [];

    $scope.loadDataForRange().then(function(result){
      
      var resultArray = Object.keys(result).map(function(key) {
        return [(key), result[key]];
      });

      resultArray.unshift(EXPENSES_SUMMARY_HEADERS);

      expensesSummaryHot = new Handsontable(expensesSummaryDataTable, {
        data: resultArray,
        rowHeaders: true,
        colHeaders: true,
        filters: true,
        dropdownMenu: true
      });      

    })


  }

  $scope.dateTypeClicked = function(dateType){
    if(dateType == 'byDateRange'){

      $scope.showFooter = false;

      fromDatePickerObj = {
        callback: function (val) {  //Mandatory          
          $scope.fromDate = new Date(val);
          $scope.toDate = undefined;
        },
        closeOnSelect: true,
      };   
      

      toDatePickerObj = {
        callback: function (val) {  //Mandatory          
          $scope.toDate = new Date(val);

        },
        closeOnSelect: true,
      };      

    }else{
      $scope.showFooter = true;
    }



  }

  $scope.openDatePicker = function(){
    ionicDatePicker.openDatePicker(datePickerObj);
  };

  $scope.openFromDatePicker = function(){
    ionicDatePicker.openDatePicker(fromDatePickerObj);
  };

  $scope.openToDatePicker = function(){
    ionicDatePicker.openDatePicker(toDatePickerObj);
  };    

  $scope.previousDate = function(){
    $scope.currentSelectedDate.setDate($scope.currentSelectedDate.getDate() - 1);
    $scope.loadDataByDate();
  }

  $scope.nextDate = function(){
   $scope.currentSelectedDate.setDate($scope.currentSelectedDate.getDate() + 1); 
   $scope.loadDataByDate();
  }

  $scope.addNewExpense = function(){

    removeTotalRow();

    var newR = [];

    $scope.ExpensesData.push(newR);
    expensesHot.loadData($scope.ExpensesData);

  }


$scope.getDataForDate = function(date){

    console.log('getDataForDate date',date);

    var deferred = $q.defer();

    db.get(date).then(function (doc) {
      deferred.resolve(doc);
    }).catch(function (err) {
      deferred.reject(err);
    });

    return deferred.promise;
}  


$scope.loadDataByDate = function(){

   $scope.getDataForDate(getDateForDB($scope.currentSelectedDate))
      .then(function (doc) {
      $scope.ExpensesData = doc.data;

        var total = 0;        

        for(var i=1;i<$scope.ExpensesData.length;i++){
          var currentRow = $scope.ExpensesData[i];


          currentRowAmout = parseInt(currentRow[AMOUNT]) ? parseInt(currentRow[AMOUNT]) : 0;
          
          total += currentRowAmout;
          $scope.todaysExpensesTotal = total;
             
        }

        var TOTAL = ["Total", total];
        $scope.ExpensesData.push(TOTAL);

        expensesHot.loadData($scope.ExpensesData);
        
        getTodaysCashTotal().then(function(result){
          $scope.todaysCashTotal = result;

          var summaryHeaders = ["TOTAL CASH RCVD", "TOTAL EXPENSES", "BALANCE"];

            $scope.summaryData = [
              summaryHeaders,
            ];

            var summaryRowData = [$scope.todaysCashTotal, $scope.todaysExpensesTotal, $scope.todaysCashTotal - $scope.todaysExpensesTotal];

            $scope.summaryData.push(summaryRowData);

            summaryHot = new Handsontable(todaysSummaryDataTable, {
              data: $scope.summaryData,
            }); 

            summaryHot.render();


        });

        expensesHot.render();

    }).catch(function (err) {
      console.log('errddd',err);
      setBlankTableData();
    });


  }

  $scope.loadDataForRange = function(){

    var promises = [];
    var deferred = $q.defer();
    
    if(!$scope.fromDate || !$scope.toDate){
      console.log('no all dates');
      return;
    }

    var currentDate = new Date($scope.fromDate.getTime());

    var arrayOfDates = [];

    arrayOfDates.push(getDateForDB($scope.fromDate));

    while(getDateForDB($scope.toDate) != getDateForDB(currentDate)){
      console.log('while');

      var nextDate = currentDate.getDate() + 1;

      currentDate.setDate(nextDate);

      arrayOfDates.push(getDateForDB(currentDate));
    }

    console.log('---------');
    for(var i=0;i<arrayOfDates.length;i++){
        console.log('f1');

        promises.push($scope.rangeDataArray(arrayOfDates[i]));
        
    }

    $q.all(promises).then(function(){
      // console.log('DONE');
      deferred.resolve(RangeData);
    })

    return deferred.promise;
  }

  $scope.rangeDataArray = function(arrayOfDates_i){

        var promises = [];
        var deferred = $q.defer();

        $scope.getDataForDate(arrayOfDates_i)
          .then(function(doc) {

            var dataForThisDate = doc.data;

              if(dataForThisDate){

                for (var i = dataForThisDate.length - 1; i >= 1; i--) {
                   promises.push($scope.calculateRangeData(dataForThisDate[i]));
                }

              $q.all(promises).then(function(){
                deferred.resolve();
              });                     

              }

          })
          .catch(function(err) {
            deferred.resolve();
          });

        return deferred.promise;

  }

  $scope.calculateRangeData = function(dataForThisDate){

      var singleDateData = dataForThisDate;
      if(singleDateData[AMOUNT]){

        var name = singleDateData[NAME]
        var amt = parseInt(singleDateData[AMOUNT]);

        var prevAmt = parseInt(RangeData[name]) ? parseInt(RangeData[name]) : 0;

        RangeData[name] =  prevAmt + amt;

      }

  }

  $scope.gotoTransactions = function(){
    $state.go('dash')
  }  

  $scope.gotoSalary = function(){
    $state.go('salary');
  }  

  $scope.gotoSettings = function(){
    $state.go('settings');
  }

  $scope.initDB = function(){
    db = new PouchDB('cauveryDB');
  }


  $scope.save = function(){

      removeTotalRow();

      var id = getDateForDB($scope.currentSelectedDate);

      db.get(id.toString()).then(function(doc) {

       db.put({
          _id: doc._id,
          _rev: doc._rev,
          data: $scope.ExpensesData  
        });


      }).then(function(response) {
        $scope.loadDataByDate();
      }).catch(function (err) {
        console.log(err);

       db.put({
          _id: id.toString(),
          data: $scope.ExpensesData      
        });

      });    

  }

  $scope.cancel = function(){
    $scope.loadDataByDate();
  }

    var removeTotalRow = function(){

      if($scope.ExpensesData[$scope.ExpensesData.length-1][0] == "Total"){
        $scope.ExpensesData.pop();
      }      

    }  


  var getDateForDB = function(givenDate){
      var dateForDB = givenDate.getDate().toString() + givenDate.getMonth().toString() + givenDate.getFullYear().toString();
      return "expenses_"+dateForDB;
  }

  var setBlankTableData = function() {
    console.log('setBlankTableData');
      $scope.ExpensesData = [
          HEADERS,
      ];
      for (var i = 0; i < commonExpenseTypes.length; i++) {
          $scope.ExpensesData.push([commonExpenseTypes[i]]);
      }
      expensesHot.loadData($scope.ExpensesData);
  }




  // ============
  var getTodaysCashTotal = function() {
      var deferred = $q.defer();

      var id = getTransactionsDateForDB($scope.currentSelectedDate);
      db.get(id.toString()).then(function(doc) {
          $scope.data = doc.data;
          var currentRowCashTotal = 0;
          for (var i = 1; i < $scope.data.length; i++) {
              var currentRow = $scope.data[i];
              var currentRowCash = parseInt(currentRow[TRANSACTIONS_CASH]);
              currentRowCash = currentRowCash ? currentRowCash : 0;
              currentRowCashTotal += currentRowCash ? currentRowCash : 0;
              
          }
          deferred.resolve(currentRowCashTotal);

      }).catch(function(err) {
        console.log('err 4545');
          deferred.reject(err);
      });

      return deferred.promise;
  }

  // ==========

  var getTransactionsDateForDB = function(givenDate){
      var dateForDB = givenDate.getDate().toString() + givenDate.getMonth().toString() + givenDate.getFullYear().toString();
      return "transactions_"+dateForDB;
  }

  $scope.updateDenominations = function(){
    console.log('$scope.DenominationsData',$scope.DenominationsData);
    var total = 0;
    for(var i=0;i<$scope.DenominationsData.length;i++){
      if($scope.DenominationsData[i][1]){
        
        var row = $scope.DenominationsData[i];
        total += parseInt(row[0]) * row[1];
       
      }
    }
     console.log('tt',total);
     $scope.denominationsTotal = total;
  }

  $scope.deleteThisMonthsData = function(){
     
  }
  
  $scope.init(); 

});

