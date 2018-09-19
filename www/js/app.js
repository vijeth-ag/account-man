// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.services' is found in services.js
// 'starter.controllers' is found in controllers.js
angular.module('starter', ['ionic', 'starter.controllers','starter.settings', 'starter.services','starter.salary', 'starter.expenses'])

.run(function($ionicPlatform) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs).
    // The reason we default this to hidden is that native apps don't usually show an accessory bar, at
    // least on iOS. It's a dead giveaway that an app is using a Web View. However, it's sometimes
    // useful especially with forms, though we would prefer giving the user a little more room
    // to interact with the app.
    if (window.cordova && window.Keyboard) {
      window.Keyboard.hideKeyboardAccessoryBar(true);
    }

    if (window.StatusBar) {
      // Set the statusbar to use the default style, tweak this to
      // remove the status bar on iOS or change it to use white instead of dark colors.
      StatusBar.styleDefault();
    }
  });
})

.directive('verticalScroll', function () {
    return {
        link: function (scope, element, attrs) { // eslint-disable-line no-unused-vars
            var base = 0
            element.bind("DOMMouseScroll mousewheel onmousewheel", function (oldEvent) {

              // console.log('oldEvent',oldEvent);
                // cross-browser wheel delta
                var event = window.event || oldEvent; // old IE support
                var delta = Math.max(-1, Math.min(1, (event.wheelDelta || -event.detail)));

                scope.$apply(function () {

                    base += 30 * delta;
                    element.children().css({
                        'transform': 'translateY(' + base + 'px)'
                    });
                });
                // for IE
                event.returnValue = false;
                // for Chrome and Firefox
                if (event.preventDefault) {
                    event.preventDefault();
                }
            });
        }
    };
})

.config(function($stateProvider, $urlRouterProvider) {

  // Ionic uses AngularUI Router which uses the concept of states
  // Learn more here: https://github.com/angular-ui/ui-router
  // Set up the various states which the app can be in.
  // Each state's controller can be found in controllers.js
  $stateProvider


    .state('dash', {
      url: "/dash",      
      templateUrl: "templates/tab-dash.html",
      controller: 'DashCtrl'
    })
    .state('salary', {
      url: "/salary",      
      templateUrl: "templates/salary.html",
      controller: 'SalaryCtrl'
    })  
    .state('expenses', {
      url: "/expenses",      
      templateUrl: "templates/expenses.html",
      controller: 'ExpensesCtrl'
    })        
    .state('settings', {
      url: "/settings",      
      templateUrl: "templates/settings.html",
      controller: 'SettingsCtrl'
    })


  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('dash');

});
