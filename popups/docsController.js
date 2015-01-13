

function DocsController($scope, $http, gdocs, keepass) {
	$scope.docs = [];

	$scope.choosePasswordFile = function(doc) {
		chrome.storage.sync.set({'passwordFile': doc}, function() {
  		keepass.setFile(doc.url);
  		$scope.fileName = doc.title;
  		$scope.$apply();
		});
	};

  $scope.chooseAnotherDoc = function() {
    $scope.fileName = "";
    $scope.fetchDocs();
  }

	$scope.fetchDocs = function() {
		$scope.docs = [];
    $scope.refreshing = true;

    gdocs.getPasswordFiles(true).then(function(docs) {
      $scope.docs = docs.map(function(doc) {
        doc.selected = function() { return (entry.title == $scope.fileName); }
        return doc;
      });

      $scope.refreshing = false;
      $scope.errorMessage = "";
      $scope.$apply();
    }).catch(function(err) {
      $scope.errorMessage = err.message || "Unknown Error";
      $scope.refreshing = false;
    });
	};

  //authorizes and fetches the docs
  $scope.authorize = function() {
	  requestGoogleUrlPermissions(true).then(function() {
  	  return gdocs.auth(true);
	  }).then(function() {
	    $scope.fetchDocs();
	  }).catch(function(err) {
	    $scope.errorMessage = err.message || "Error authorizing"
	  });
  };

  $scope.logout = function() {
		gdocs.revokeAuthToken();
  };

  //returns true if user is authenticated to google docs
	$scope.authorized = function() {
	  return (gdocs.accessToken) ? true : false;
	}

  //requests permissions to google urls
	function requestGoogleUrlPermissions(interactive) {
	  if (!interactive) {
	    return Promise.resolve();   //can only request permission if it is interactive
	  }

    var resolve, reject;
    var p = new Promise(function(res, rej) {
      resolve = res;
      reject = rej;
    });

	  chrome.permissions.request({
      origins: [
        "https://docs.google.com/feeds/",
        "https://docs.googleusercontent.com/",
        "https://spreadsheets.google.com/feeds/",
        "https://ssl.gstatic.com/",
        "https://www.googleapis.com/"
    	]
    }, function(granted) {
      // The callback argument will be true if the user granted the permissions.
      if (granted) {
        resolve();
      } else {
        reject(new Error('User denied access to google docs urls'));
      }
    });

    return p;
	}

	$scope.fetchDocs();

	chrome.storage.sync.get('passwordFile', function(items) {
		if (items.passwordFile) {
			$scope.fileName = items.passwordFile.title;
			keepass.setFile(items.passwordFile.url);
			$scope.$apply();
		}
	});

}

DocsController.$inject = ['$scope', '$http', 'gdocs', 'keepass'];
// For code minifiers.

