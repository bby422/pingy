
var express=require("express"),
app=express(),
server,
static_dir=process.cwd()+""
,port=process.env.VMC_APP_PORT||8080;

app.use(express.static(static_dir));

app.use(function(req,res,next){
	res.status(404).send('...');
});

server=app.listen(port,function(){
	console.log("start app listen %d port !",server.address().port);
	console.log("static_dir is %s",static_dir);
});