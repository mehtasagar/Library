 // set up ========================
    var express  = require('express');
    var app      = express();                               // create our app w/ express
    var morgan = require('morgan');             // log requests to the console (express4)
    var bodyParser = require('body-parser');    // pull information from HTML POST (express4)
    var methodOverride = require('method-override'); // simulate DELETE and PUT (express4)
    var mysql = require("mysql");                      //using Mysql database 
    // configuration =================

  //  mongoose.connect('mongodb://node:nodeuser@mongo.onmodulus.net:27017/uwO3mypu');     // connect to mongoDB database on modulus.io

    app.use(express.static(__dirname + '/public'));                 // set the static files location /public/img will be /img for users
    app.use(morgan('dev'));                                         // log every request to the console
    app.use(bodyParser.urlencoded({'extended':'true'}));            // parse application/x-www-form-urlencoded
    app.use(bodyParser.json());                                     // parse application/json
    app.use(bodyParser.json({ type: 'application/vnd.api+json' })); // parse application/vnd.api+json as json
    app.use(methodOverride());


    // define model =================
    var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "India@123",
    database: "library"
    });
con.connect(function(err){
  if(err){
    console.log('Error connecting to Db');
    console.log(err);
    return;
  }
  console.log('Connection established');
});
//--------------------------------------------------------
   
    // api ---------------------------------------------------------------------
     app.post('/lib/loanRefresh', function(req, res) {

      
   var qInsert="Insert into fine (select b.loan_id, "+
                "if(date_in is null, datediff(curdate(),due_date)*0.25,datediff(date_in,due_date)*0.25),0 "+
                "from book_loan b where( datediff(date_in,due_date)>0 || (datediff(curdate(),due_date)>0 && date_in is null)))  "+
                "on duplicate key update fine_amount=if(paid=values(paid), "+
                "if(date_in is null, datediff(curdate(),due_date)*0.25,datediff(date_in,due_date)*0.25),fine_amount)";

   var qSelect='select  l.card_no,b.fname , b.lname,f.paid, sum(f.fine_amount) AS amount '+
            'from book_loan l join fine f join borrower b on l.loan_id=f.loan_id and b.card_no=l.card_no '+
            'group by  l.card_no,b.fname , b.lname, f.paid '+
            'having (((sum(f.fine_amount))>0)or f.paid=0) order by f.paid';
    var q1=  con.query(qInsert, function(err,resp){
      if(err) throw err;
            var q2=  con.query(qSelect, function(err,resp){
             if(err) throw err;
            res.send(resp);  
     });
        console.log(q2.sql);  
    });
        console.log(q1.sql);  
     
     });



       app.post('/lib/loanPay', function(req, res) {
        var response={};
          console.log(req.body.card_no);
              var q='select * from book_loan l join borrower b join fine f on b.card_no=l.card_no and f.loan_id=l.loan_id and f.paid=0 and date_in is  null and l.card_no like ?';
           var q1=  con.query(q,req.body.card_no, function(err,resp){
          if(err) throw err;
          console.log(resp.length);
            if(resp.length>0){
               response.message="All books are not returned!!";
               response.flag="0";
               console.log(response);
               res.send(response);   
            }else{
                var q4= 'select l.loan_id from book_loan l join fine f on f.loan_id=l.loan_id and f.paid=0 and  card_no like ?';
                var q5=  con.query(q4,req.body.card_no, function(err,resp1){
                if(err) throw err;
                console.log(resp1);
                var loans=[];
                for(var i=0;i<resp1.length;i++){
                  loans[i]=resp1[i].loan_id;
                }
                console.log(loans);
                var q2= 'update fine set paid=1 where loan_id in (?) ';
                var q3=  con.query(q2,[loans], function(err,resp2){
                if(err) throw err;
                console.log("Update succesful");
                response.message="Fine Paid Successfully!!!";
                response.flag="1";
                console.log(response);
                res.send(response);  
              });
              console.log(q3.sql);
               });
                              console.log(q5.sql);

            }
            
         });
        console.log(q1.sql);  



     });   

   app.post('/lib/loanList', function(req, res) {
    var q='select  l.card_no,b.fname , b.lname,f.paid, sum(f.fine_amount) AS amount '+
            'from book_loan l join fine f join borrower b on l.loan_id=f.loan_id and b.card_no=l.card_no '+
            'group by l.card_no,b.fname , b.lname, f.paid '+
            'having (((sum(f.fine_amount))>0)or f.paid=0)  order by f.paid';
    var q1=  con.query(q, function(err,resp){
      if(err) throw err;
   
        res.send(resp);  
     });
        console.log(q1.sql);  


   });


    app.post('/lib/search', function(req, res) {
                   
            var searchParam =  req.body;
            console.log(searchParam.book + " "+searchParam.author + " "+searchParam.isbn+" " + searchParam.contains );
            var book="";
            var author="";
            var isbn="";
            if(searchParam.contains==="contains"){
                if(searchParam.book!==undefined ){
                book="%"+searchParam.book+"%";    
                }
                if(searchParam.author!==undefined){
                author="%"+searchParam.author+"%";    
                }
                   if(searchParam.isbn!==undefined){
                isbn="%"+searchParam.isbn+"%";    
                }
            }else if(searchParam.contains==="start"){
                 if(searchParam.book!==undefined){
                book=searchParam.book+"%";    
                }
                if(searchParam.author!==undefined){
                author=searchParam.author+"%";    
                }
                   if(searchParam.isbn!==undefined){
                isbn=searchParam.isbn+"%";    
                }
            
             }else if(searchParam.contains==="exact"){
                 if(searchParam.book!==undefined){
                book=searchParam.book;    
                }
                if(searchParam.author!==undefined){
                author=searchParam.author;    
                }
                   if(searchParam.isbn!==undefined){
                isbn=searchParam.isbn;    
                }
            }
      // console.log(author+book+isbn);
           
           var qry="SELECT b.isbn, b.title, b.publisher,b.cover,b.pages,a.full_name, br.branch_id,l.branch_name, "+ 
"br.no_of_copy, br.remaining_copy FROM book b join book_author ba join author a join branch_copy br join library_branch l "+
"on b.isbn=ba.isbn and ba.author_id=a.author_id and b.isbn=br.book_id and br.branch_id=l.branch_id "+
"and (b.isbn like  ? or b.title like  ? or  a.full_name like ?)";
            if(searchParam.contains!==undefined){
                con.query(qry,[isbn,book,author],function(err,rows){
                if(err) throw err;

                console.log('Data received from Db:post:\n');
                console.log(rows.length);

                 res.send(rows); 
               // res.json(rows); // return all todos in JSON format
            });
}     

            
            // get and return all the todos after you create another
        
      

    });

app.post('/lib/searchCheckIn', function(req, res) {
                   
            var searchParam =  req.body;
            console.log(searchParam.card_no + " "+searchParam.bname + " "+searchParam.isbn+" " + searchParam.contains );
            var card_no="";
            var bname="";
            var isbn="";
            if(searchParam.contains==="contains"){
                if(searchParam.card_no!==undefined ){
                card_no="%"+searchParam.card_no+"%";    
                }
                if(searchParam.bname!==undefined){
                bname="%"+searchParam.bname+"%";    
                }
                   if(searchParam.isbn!==undefined){
                isbn="%"+searchParam.isbn+"%";    
                }
            }else if(searchParam.contains==="start"){
                 if(searchParam.card_no!==undefined){
                card_no=searchParam.card_no+"%";    
                }
                if(searchParam.bname!==undefined){
                bname=searchParam.bname+"%";    
                }
                   if(searchParam.isbn!==undefined){
                isbn=searchParam.isbn+"%";    
                }
            
             }else if(searchParam.contains==="exact"){
                 if(searchParam.card_no!==undefined){
                card_no=searchParam.card_no;    
                }
                if(searchParam.bname!==undefined){
                bname=searchParam.bname;    
                }
                   if(searchParam.isbn!==undefined){
                isbn=searchParam.isbn;    
                }
            }
      // console.log(bname+book+isbn);
           
           var qry="select b.fname,b.lname, l.card_no, l.isbn,l.loan_id,l.branch_id,l.date_out,l.due_date,bk.title, bc.remaining_copy "+ 
                        "from borrower b join book_loan l join book bk join branch_copy bc on bc.book_id=l.isbn and b.card_no= l.card_no and l.isbn=bk.isbn and bc.remaining_copy<bc.no_of_copy "+
                        "and (l.date_in is null or ((datediff(date_in,curdate()))>0)) and (l.isbn like  ? or l.card_no like  ? or  b.fname like ? or b.lname like ?)";
            if(searchParam.contains!==undefined){
             var q=   con.query(qry,[isbn,card_no,bname,bname],function(err,rows){
                if(err) throw err;

                console.log('Data received from Db:post:SearchCheckIN:\n');
                console.log(rows.length);

                 res.send(rows); 
               // res.json(rows); // return all todos in JSON format
            }); 
    console.log(q.sql);   
}     

    });


  app.post('/lib/checkIn', function(req, res) {
    console.log(req.body);

    var response={};
  for (i = 0; i < req.body.length; i++) { 
    
    if(req.body[i].select){
    console.log(req.body[i].loan_id);  
    var loan_id=req.body[i].loan_id;
    var bookNos= req.body[i].remaining_copy+1;
    var br_id=req.body[i].branch_id;
    var isbn=req.body[i].isbn;
    var q=con.query('UPDATE book_loan SET date_in = curdate() Where loan_id = ?',loan_id,function(err,rows){
                if(err) throw err;
                console.log('Data received from Db:post:checkIn Update\n');
                console.log('Changed ' + rows.changedRows + ' rows');
                var q1=  con.query('Update branch_copy SET remaining_copy=? where branch_id=? and book_id=?', [bookNos,br_id,isbn], function(err,resp){
                        if(err) throw err;
                        console.log('Changed ' + resp.changedRows + ' rows');
                           res.send(resp);  
                            });
                     console.log(q1.sql);  
                    });
    console.log(q.sql);  
      } 
    }
  });


  app.post('/lib/register', function(req, res) {
    console.log(req.body.ssn);

    var response={};
    //req.body.card_no=card_no;
   // console.log(req.body.card_no);
    var id=con.query('SELECT *  FROM borrower ORDER BY card_no DESC LIMIT 1',function(err,lastId){
                 if(err) throw err;
                 console.log(lastId[0].card_no);
                     var card_no=Number(lastId[0].card_no.substring(4,8));
                     console.log(card_no);
                     card_no=card_no+1;
                     console.log(card_no);
                     var temp=lastId[0].card_no.substring(0,4);
                     console.log(temp);
                     temp = temp+ card_no;
                     req.body.card_no=temp;
                     console.log(temp);



    var q=con.query('SELECT * FROM borrower where ssn=?',req.body.ssn,function(err,rows){
                if(err) throw err;

                console.log('Data received from Db:post:\n');
                
                if(rows.length===1){
                 response.flag=0;   
                 console.log(response);
                 res.send(response);   
                  
                }else if(rows.length<1){

                     response.flag=1;
                   var q1=   con.query('INSERT INTO borrower SET ?', req.body, function(err,resp){
                        if(err) throw err;
                       
                        res.send(response);  
                
                 
               // res.json(rows); // return all todos in JSON format
            });console.log(q1.sql);  
                  }
  });console.log(q.sql);  
   }); console.log(id.sql);  
  });


 app.post('/lib/checkOut', function(req, res) {
    var respond={};
    var respond1={};
    console.log(req.body.card_no.trim());

    var q=con.query('select *  from borrower where card_no like ?',req.body.card_no.trim(),function(err,rowss){
               
                if(err) throw err;

                console.log('Data received from Db:post:\n');
                respond=rowss;
                console.log(rowss.length);
                if(rowss.length===0){
                   respond.flag=0;
                   respond.message1="Borrower Does not Exist";
                  
                   console.log(respond);
                   res.send(respond); 
                }else{

                var q11=con.query('select count(*) as count from book_loan where date_in is null and card_no like ?',req.body.card_no.trim(),function(err,rows){
               
                if(err) throw err;

                console.log('Data received from Db:post:\n');
                respond=rows;
                console.log(respond[0] );
               
                console.log(respond[0].count);
                if(respond[0].count>=3){
                   respond[0].flag=0;
                   respond[0].message1="Borrower Cannot Check Out More than 3 Books";
                  
                   console.log(respond);
                   res.send(respond); 
                }else{

               var q1=con.query('select remaining_copy from branch_copy where book_id like ? and branch_id=?',[req.body.isbn.trim(),req.body.branch_id.trim()],function(err,rows){
               
                if(err) throw err;

                console.log('Data received from Db:post:\n');
                respond=rows;
                console.log(respond[0].remaining_copy);
                if(respond[0].remaining_copy<1){
                   respond[0].flag=0;
                   respond[0].message1="Book not available at given Branch";
             
                   console.log(respond);
                   res.send(respond); 
                }else{
                      console.log(respond1);
console.log(req.body.isbn.trim()+req.body.branch_id.trim()+req.body.card_no.trim());
        var q2=con.query('insert into book_loan(isbn,branch_id,card_no,date_out,due_date) VALUES (?,?,?,curdate(),DATE_ADD(curdate(),INTERVAL 14 DAY))',[req.body.isbn.trim(),req.body.branch_id.trim(),req.body.card_no.trim()],function(err,rows){
               
                if(err) throw err;
                var remaining=respond[0].remaining_copy-1;
                console.log('Data received from Db:post:\n');
                console.log('Last insert ID:', rows.insertId);
                var q3=con.query('update branch_copy set remaining_copy= ? where book_id like ? and branch_id like ?',[remaining,req.body.isbn.trim(),req.body.branch_id.trim()],function(err,rows1){
               
                if(err) throw err;

                console.log('Data received from Db:post:\n');
                console.log('Changed ' + rows1.changedRows + ' rows');
                console.log(respond[0].remaining_copy);
               
                   respond[0].flag=1;
                   respond[0].message1="Book Check-out Successful.";
                   console.log(respond);
                   res.send(respond); 
                
              }); 
    console.log(q3.sql);     
    }); 
    console.log(q2.sql); 
                }
               
                }); 
                console.log(q1.sql); 


                }
               
    }); 
    console.log(q11.sql);    
 
            }
               
    }); console.log(q.sql); 

 });

 app.get('*', function(req, res) {
        res.sendfile('./public/index.html'); // load the single view file (angular will handle the page changes on the front-end)
    });
    // listen (start app with node server.js) ======================================
    app.listen(8080);
    console.log("App listening on port 8080");
