var libApp = angular.module('libApp', ['angularUtils.directives.dirPagination','ngRoute']);

libApp.config(['$routeProvider', '$locationProvider',function($routeProvider, $locationProvider){
  $routeProvider
  .when("/checkIn",
    {
      templateUrl: "checkIn.html",
      controller: "checkInCtrl",
      controllerAs: "libApp"
    })
  .when("/checkOut/:isbn/:branch_id/:remaining_copy/:title",
    {
      templateUrl: "checkOut.html",
      controller: "checkOutCtrl",
      controllerAs: "bk"
    })
   .when("/borrower",
    {
      templateUrl: "borrower.html",
      controller: "borrowerCtrl",
      controllerAs: "libApp"
    })
    .when("/fine",
    {
      templateUrl: "fine.html",
      controller: "fineCtrl",
      controllerAs: "libApp"
    })
  .otherwise({
      templateUrl: "search.html",
      controller: "searchCtrl",
      controllerAs: "libApp"
    });
}])

.controller('MainCtrl', ['$route', '$routeParams', '$location','$scope','$http',
  function($route, $routeParams, $location,$scope,$http) {
    this.$route = $route;
    this.$location = $location;
    this.$routeParams = $routeParams;
       $scope.formData = {};
}])


.controller('fineCtrl', ['$routeParams','$scope','$http', function($routeParams,$scope,$http) {
    $scope.form1={};
    $scope.message="";
    $scope.initial=function(){

  $http.post('/lib/loanList')
            .success(function(data) {
                $scope.form1 = {}; // clear the form so our user is ready to enter another
                $scope.loanLists = data;
                console.log("Loan Lists  recieved sucessfully");
           
            })
            .error(function(data) {
                console.log('Error: ' + data);
            });

   }    
    $scope.initial();
  $scope.sort = function(keyname){
        $scope.sortKey = keyname;   //set the sortKey to the param passed
        $scope.reverse = !$scope.reverse; //if true make it false and vice versa
    }

     $scope.refresh = function(){
         $http.post('/lib/loanRefresh' )
            .success(function(data) {
                $scope.loanLists = data;
                console.log("Loan Lists");
           
            })
            .error(function(data) {
                console.log('Error: ' + data);
            });
    }


     $scope.pay = function(loan){

      if(loan.amount==="" || loan.amount<0.25){
        alert("Enter Fine Amount!");
      }else{
              console.log(loan);
         $http.post('/lib/loanPay', loan)
            .success(function(data) {
                $scope.loanLists = data;
                console.log(data);
                if (data.flag==="0"){
                  alert(data.message);

                }else{
                 alert(data.message); 
                }
                $scope.initial();

            })
            .error(function(data) {
                console.log('Error: ' + data);
            });
       }     
    }
 


}])

.controller('checkInCtrl', ['$routeParams','$scope','$http',  function($routeParams,$scope,$http) {
  this.name = "checkInCtrl";
  $scope.bookData={};
    $scope.checkIN={};
         $scope.checkIN.contains="exact";
$scope.checkInMessage="";
  this.params = $routeParams;
 $scope.sort = function(keyname){
        $scope.sortKey = keyname;   //set the sortKey to the param passed
        $scope.reverse = !$scope.reverse; //if true make it false and vice versa
    }

     $scope.checkIn = function() { 
        console.log($scope.bookData);
            $http.post('/lib/checkIn',$scope.bookData).success(function(data) {
                // clear the form so our user is ready to enter another
                $scope.bookData = {};
                $scope.dataIn=data;
             
                console.log(data);
                console.log("CheckIn successful");
                $scope.checkInMessage="CheckIn Successful";
            })
            .error(function(data) {
                console.log('Error: ' + data);
            });

     };
       $scope.searchCheckIn = function() { 
       $scope.checkInMessage="";

        $http.post('/lib/searchCheckIn',$scope.checkIN).success(function(data) {
                // clear the form so our user is ready to enter another
                $scope.bookData = data;
             
                console.log(data);
                console.log("Search successful");
            })
            .error(function(data) {
                console.log('Error: ' + data);
            });
  };
}])

.controller('borrowerCtrl', ['$routeParams','$scope','$http', function($routeParams,$scope,$http) {
    $scope.form1={};
    $scope.message="";
 $scope.register=function(){
 $http.post('/lib/register', $scope.form1)
            .success(function(data) {
                                $scope.user = data;
             
                console.log($scope.user + "---"+$scope.user.flag);
              
                     if( $scope.user.flag===1){
                      $scope.form1 = {}; // clear the form so our user is ready to enter another

                  $scope.message="User Registered Successfully!!";
                  console.log("User Registered");
            }else if ( $scope.user.flag===0){
                   $scope.message="Duplicate User!!";
            };
            })
            .error(function(data) {
                console.log('Error: ' + data);
            });

       

 };
}])

.controller('searchCtrl', ['$routeParams','$scope','$http', function($routeParams,$scope,$http) {
  this.name = "searchCtrl";
  this.params = $routeParams;
    $scope.formData = {};
    $scope.formData.contains="exact";
  $scope.sort = function(keyname){
        $scope.sortKey = keyname;   //set the sortKey to the param passed
        $scope.reverse = !$scope.reverse; //if true make it false and vice versa
    }
    $scope.searchLib = function() { 
       
        $http.post('/lib/search',$scope.formData).success(function(data) {
                // clear the form so our user is ready to enter another
                $scope.books = data;
             
                console.log(data);
                console.log("Search successful");
            })
            .error(function(data) {
                console.log('Error: ' + data);
            });
  };
}])
.controller('checkOutCtrl',['$routeParams', '$scope','$http', function($routeParams,$scope,$http) {
  this.name = "checkOutCtrl";
  $scope.bkParams = $routeParams;
  console.log($scope.bkParams+"--");
  $scope.checkOut = function() { 
    $scope.message1="";
    $scope.message2="";
        console.log("in checkOut");
        $http.post('/lib/checkOut', $scope.bkParams)
            .success(function(data) {
                $scope.loan = data;
                console.log(data);
                console.log($scope.loan + "---"+$scope.loan[0].count);
                $scope.message1=$scope.loan[0].message1;
                  /*   if( $scope.loan.flag===1){
                            $scope.message1="Book Issue Successful!!";
                            console.log("User Registered");
                      }else if ( $scope.loan.flag===0){
                           
                      };*/
            })
            .error(function(data) {
                console.log('Error: ' + data);
            });

       

  };

}]);



/*function mainController($scope, $http) {
    $scope.formData = {};

    // when landing on the page, get all todos and show them
    $http.get('/api/todos')
        .success(function(data) {
            $scope.todos = data;
            console.log("hello");
            console.log(data);
           

        })
        .error(function(data) {
            console.log('Error: ' + data);
        });

    // when submitting the add form, send the text to the node API
    $scope.createTodo = function() {
        $http.post('/api/todos', $scope.formData)
            .success(function(data) {
                $scope.formData = {}; // clear the form so our user is ready to enter another
                $scope.todos = data;
             
                console.log(data);
                    console.log("hello post");
            })
            .error(function(data) {
                console.log('Error: ' + data);
            });
    };

    // delete a todo after checking it
    $scope.deleteTodo = function(id) {
        $http.delete('/api/todos/' + id)
            .success(function(data) {
                $scope.todos = data;
                console.log(data);
                    console.log("hello delete");
            })
            .error(function(data) {
                console.log('Error: ' + data);
            });
    };

}*/