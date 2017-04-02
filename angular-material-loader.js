(function(root, factory) {
  /* AMD module */
  if (typeof define == 'function' && define.amd) define(['angular', 'ngMaterial'], factory)

  /* Browser global */
  else factory(window.angular, window.ngMaterial)
}(this, function(angular, ngMaterial) {
  'use strict';
  
  angular.module('ngMaterialLoader', ['ngMaterial'])
  
  .service('ngMaterialLoader',['$rootScope','$timeout', function($rootScope, $timeout) {
    var self = this;
    
    self.start = function () {
      $timeout(function() {
        $rootScope.$broadcast('$ngMaterialLoaderStart');
      });
    };
    
    self.stop = function () {
      $timeout(function() {
        $rootScope.$broadcast('$ngMaterialLoaderStop');
      });
    };
  }])
  
  // Shortcut
  .factory('$ngMaterialLoader', ['ngMaterialLoader', function (ngMaterialLoader) {
    return ngMaterialLoader;
  }])
  
  .directive('ngMaterialLoader', ['$rootScope', '$document', '$mdPanel', function ($rootScope, $document, $mdPanel) {
    return {
      link: function (scope, element, attrs) {
        var mdPanel = undefined,
          position = $mdPanel.newPanelPosition().absolute().center(),
          dialog = '<md-panel><div layout="row" layout-align="center center"><md-progress-circular md-mode="indeterminate" md-diameter="76"></md-progress-circular></div></md-panel>',
          config = {
            attachTo: element,
            template: dialog,
            disableParentScroll: true,
            hasBackdrop: true,
            position: position,
            trapFocus: true,
            clickOutsideToClose: false,
            escapeToClose: false,
            focusOnOpen: true,
            zIndex: 150
          };
        
        //fix - backDrop should overlap all content on page
        element[0].style.height = 'auto';
        
        var start = function () {
          if (!mdPanel) {
            mdPanel = $mdPanel.create(config);
            mdPanel.open();
          }
        };

        var stop = function () {
          if (mdPanel) {
            mdPanel.close();
            mdPanel = undefined;
          }
        };
        
        $rootScope.$on('$ngMaterialLoaderStart', function (event) {
          start();
        });

        $rootScope.$on('$ngMaterialLoaderStop', function (event) {
          stop();
        });

        scope.$on('$destroy', function () {
          stop();
        });
      }
    };
  }])
  
  .config(['$httpProvider', function ($httpProvider) {
    $httpProvider.interceptors.push('LoadingInterceptor');
  }])

  .service('LoadingInterceptor', ['$q', '$rootScope', '$ngMaterialLoader', '$timeout',
      function ($q, $rootScope, $ngMaterialLoader, $timeout) {
    'use strict';

    var xhrCreations = 0;

    function isLoading() {
      return xhrCreations > 0;
    }

    function updateStatus() {
      
      if(isLoading()) {
        $ngMaterialLoader.start();
      } else {
        $timeout(function() {
          if (!isLoading()) {
            $ngMaterialLoader.stop();
          }
        }, 300);
      }
    }

    return {
      request: function (config) {
        xhrCreations++;
        updateStatus();
        return config;
      },
      requestError: function (rejection) {
        xhrCreations--;
        updateStatus();
        return $q.reject(rejection);
      },
      response: function (response) {
        xhrCreations--;
        updateStatus();
        return response;
      },
      responseError: function (rejection) {
        xhrCreations--;
        updateStatus();
        return $q.reject(rejection);
      }
    };
  }]);
  
}));