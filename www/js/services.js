angular.module('starter.services', [])

.service('Service', function($q) {

  var self  = this;

  var db;
  var employeesListDocId = "employeesList";

  var initDB = function(){
    db = new PouchDB('cauveryDB');
  }  
  initDB();

  self.getEmployees = function(){

      var deferred = $q.defer();

      var employees;

      var employeeNames
      
      db.get(employeesListDocId).then(function(doc) {
        
        employees =  doc.employeesList;

        delete employees[0];

        employees = employees.filter(function() { return true; }); //eliminate empty objs

        employeeNames = employees.map(function (empl, index, array) {
           return empl[0];  
        });

      }).then(function(response) {
          deferred.resolve(employeeNames);
      }).catch(function (err) {

        console.log(err);
        deferred.reject(err);

      }); 

      return deferred.promise;
  }



  self.getEmployeesData = function(){

      var deferred = $q.defer();

      var employees;

      var employeeNames
      
      db.get(employeesListDocId).then(function(doc) {
        
        employees =  doc.employeesList;

        delete employees[0];

        employees = employees.filter(function() { return true; }); //eliminate empty objs

        // employeeNames = employees.map(function (empl, index, array) {
        //    return empl[0];  
        // });

      }).then(function(response) {
          deferred.resolve(employees);
      }).catch(function (err) {

        console.log(err);
        deferred.reject(err);

      }); 

      return deferred.promise;
  }


});
