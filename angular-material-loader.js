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
    
    self.startWithoutLoader = function () {
      $timeout(function() {
        $rootScope.$broadcast('$ngMaterialLoaderStartWithoutLoader');
      });
    };
    
    self.start = function (mode) {
      $timeout(function() {
        $rootScope.$broadcast('$ngMaterialLoaderStart', mode);
      });
    };
    
    self.stop = function (mode) {
      $timeout(function() {
        $rootScope.$broadcast('$ngMaterialLoaderStop', mode);
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
          dialogLongPolling = '<md-panel><div layout="row" layout-align="center center"><md-progress-circular md-mode="indeterminate" md-diameter="76"></md-progress-circular></div></md-panel>',
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
          },
          configLongPolling = config,
          standalone = false;
          showLoader = true;
        
        //fix - backDrop should overlap all content on page
        element[0].style.height = 'auto';
        
        var startWithoutLoader = function() {
          if (showLoader) {
            showLoader = false;
          }
        }
        
        var start = function (mode) {
          if (!standalone) {
            standalone = mode;
          }
          if (!mdPanel && standalone) {
            configLongPolling.template = dialogLongPolling;
            mdPanel = $mdPanel.create(configLongPolling);
            mdPanel.open();
          }
          if (!mdPanel && !standalone && showLoader) {
            mdPanel = $mdPanel.create(config);
            mdPanel.open();
          }
        };
        
        var stopWithoutLoader = function() {
          if (!showLoader) {
            showLoader = true;
          }
        }

        var stop = function (mode) {
          if (mdPanel && !standalone) {
            mdPanel.close();
            mdPanel = undefined;
          }
          if (mdPanel && mode) {
            mdPanel.close();
            mdPanel = undefined;
            standalone = false;
          }
        };
        
        $rootScope.$on('$ngMaterialLoaderStartWithoutLoader', function (event) {
          startWithoutLoader();
        });
        
        $rootScope.$on('$ngMaterialLoaderStart', function (event, mode) {
          start(mode);
        });

        $rootScope.$on('$ngMaterialLoaderStopWithoutLoader', function (event) {
          stopWithoutLoader();
        });
        
        $rootScope.$on('$ngMaterialLoaderStop', function (event, mode) {
          stop(mode);
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