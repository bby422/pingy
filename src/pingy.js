/**
*AUTHOR:第七页(diqye) 2015年2月11日,  10:06:36 QQ:262666212
*/
(function(root,factory){
    if (typeof define === 'function' && define.amd) {
        define(["jquery"],function($){
            return factory.call(root,$);
        });
    }else{
        factory.call(root,$);
    }
}(this,function($){
    var extend=$.extend
    ,each=$.each
    ,trim=$.trim
    ,t_vars//临时变量
    ,feiScope=["el","render","extend","_7","watch","_"]//不允许定义在scope上的属性
    ,varReg=/[a-zA-Z$_][a-zA-Z0-9$_\.]*/g//匹配变量
    ,q_onReg=/y-on[a-zA-Z0-9]+///绑定事件表达式
    ,expressReg=/\{\{([^\}]*)\}\}/g //匹配表达式
    ,expressReg_test=/\{\{([^\}]*)\}\}/;
    
    function Scope(root){
        var _=this;
        if(!(_ instanceof Scope))return new Scope(root);
        _.extend({
            _:{
                nodes:[],
                varNodeMap:{},//变量 node映射
                watchMap:{},//监控映射
                _8:{}//定时器
            },
            el:root
        });
    }
    extend(Scope.prototype,{
        render:function(rvar,cbk){
            var _=this;
            throttleRender(_,rvar,cbk);
            return _;
        },
        extend:function(model){
            var _=this;
            extend(_,model);
            return _;
        },
        watch:function(varname,fn){
            if(typeof varname == "object"){
                for(key in varname)this.watch(key,varname[key]);
            }
            var twh=this._.watchMap;
            if(varname in twh)twh[varname].push(fn);
            else twh[varname]=[fn];
            return this;
        },
        _7:each//遍历
    });

    //节流优化
    function throttleRender(scope,rvar,cbk){
        clearTimeout(scope._._8[rvar]);
        render[rvar]=setTimeout(function(){
            render(scope,rvar,cbk);
        },100);
    }
    //编译表达式
    function complie(scope,rootnode){
        rootnode=rootnode||scope.el.get(0);
        each(rootnode.childNodes,function(i,node){
           switch(node.nodeType){
                case 1: //正常节点
                    complieNodeType1(scope,node);
                    break;
                case 3: //文本节点
                     complieNodeType3(scope,node);
                     break;
           }
          
        });
    }
    //正常节点
    function complieNodeType1(scope,node){
        var ctne=true;//continue
        each(node.attributes, function(i, attr){
            var attrName = attr.name//属性名
            ,val=trim(nvl(attr.value))
            ,fn
            ,type=1;
            if(attrName=="y-each"){//遍历
                type=70;
                ctne=false;
                fn=buildeach(scope,node.innerHTML,val);
                t_vars=[trim(val)];
            }else if(q_onReg.test(attrName)){
                $(node).on(attrName.split("y-on").join(""),scope[val]);
                return;
            }else if(attrName=="value"){
                type=71;
               if(expressReg_test.test(val))fn=build(scope,val);
            }else if(attrName=="y-show"){
                type=72;
                fn=buildVal(scope,val);                
            }else if(attrName=="y-html"){
                type=73;
                fn=buildVal(scope,val);
            }else{
                if(expressReg_test.test(val))fn=build(scope,val); 
            }
            
            if(fn){
                scope._.nodes.push({type:type,node:node,fn:fn,attr:attrName});
                each(t_vars,function(i,t){
                    if(scope._.varNodeMap[t]==null)scope._.varNodeMap[t]=[scope._.nodes.length-1];
                    else scope._.varNodeMap[t].push(scope._.nodes.length-1);
                });
            }
        });
         if(node.childNodes.length&&ctne)complie(scope,node);
    }
    //文本节点
    function complieNodeType3(scope,node){
       var fn,text=node.textContent;
        if(expressReg_test.test(text))fn=build(scope,nvl(text));
        if(fn){
            scope._.nodes.push({type:3,node:node,fn:fn});
            each(t_vars,function(i,t){
                if(scope._.varNodeMap[t]==null)scope._.varNodeMap[t]=[scope._.nodes.length-1];
                else scope._.varNodeMap[t].push(scope._.nodes.length-1);
            });
        }
    }
    function triggerWatch(scope,varname){
        for(var key in scope._.watchMap){
            if(varname==null)run(scope._.watchMap[key]);
            else if(varname==key){
                run(scope._.watchMap[key]);
            }else if(varname.indexOf(key+".")==0){
                run(scope._.watchMap[key]);
            }
        }
        function run(ary){
            for(var i=0,l=ary.length;i<l;i++)ary[i]();
        }
    }
    //渲染页面 渲染指定变量相关 多个以逗号隔开
    function render(scope,rvar,cbk){
        var nodes1=scope._.nodes,rvars;
        if(typeof rvar == "string"){
            nodes1=[];
            rvars=rvar.split(",");
            each(rvars,function(i,t){
                for(var key in scope._.varNodeMap){
                    var tt=trim(t),tkey=trim(key);
                    if(tt==tkey){
                        appendNodes(scope,nodes1,scope._.varNodeMap[key]);
                    }else if(tkey.indexOf(tt+".")==0){
                        appendNodes(scope,nodes1,scope._.varNodeMap[key]);
                    }
                }
            });
        }
        each(nodes1,function(i,t){
            switch(t.type){
                case 1:
                    t.node.setAttribute(t.attr,t.fn(scope));
                    break;
                case 3:
                    t.node.textContent=t.fn(scope);
                    break;
                case 70:
                    t.node.innerHTML=t.fn(scope);
                    break;
                case 71:
                    $(t.node).val(t.fn(scope));
                    break;
                case 72:
                    if(t.fn(scope))$(t.node).show();
                    else $(t.node).hide();
                    break;
                case 73:
                     t.node.innerHTML=t.fn(scope);  
                    break;    
            }
        });
        if(typeof rvar=="string"){
            each(rvars,function(i,t){
                triggerWatch(scope,t);
            });
        }else if(rvar==true)triggerWatch(scope);
        if(cbk)cbk();
    }
    function appendNodes(scope,n1,n2){
        for(var i=0,l=n2.length,t;i<l;i++){
            t=scope._.nodes[n2[i]];
            if(n1.indexOf(t)==-1)n1.push(t);
        }
    }
    //绑定变量
    function vartoscope(scope){
        scope.el.on("keyup change",function(e){
            var changeel=$(e.target),
            name=trim(changeel.attr("name")),
            val=changeel.val(),
            vars,
            lasti,
            fn;
            if(name=="")return;
            if(changeel.is("[type=radio]")&&!changeel.is(":checked"))return;
            if(changeel.is("[type=checkbox]")){
                var val=[];
                scope.el.find("[name="+name+"][type=checkbox]:checked").each(function(i,t){
                    val.push($(t).val());
                });
            }
            fn=new Function("scope","val","scope."+name+"=val;");
            fn(scope,val);
            scope.render(name);
        });
        //反复思考 还是决定第一次不要全盘初始化
        // scope.el.find("input,select").trigger("change");
    }
    //勾践表达式
    function build(scope,str){
        t_vars=[];
        var fn,
        fnstr="var __=[];with(scope){__.push('",
        constr=str.replace( /([\\'])/g, "\\$1" ).replace( /[\r\t\n]/g, " " ).replace(expressReg,function(all,express){
            var vars=nvl(express).match(varReg);
            each(vars,function(i,t){t_vars.push(t)});
            return "');__.push("+expressfn(express)+");__.push('";
        }),
        endstr="');} return __.join('')";
        if(trim(constr)=="")return null;
        fn=new Function("scope",fnstr+constr+endstr);
        return fn;
    }
    //取值
    function buildVal(scope,express){
        var fn,vars;
        t_vars=[];
        fn=new Function("scope","with(scope){return "+express+";}");
        vars=nvl(express).match(varReg);
        each(vars,function(i,t){t_vars.push(t)});
        return fn;
    }
    //y-each
    function buildeach(scope,str,evar){
        var fn,
        fnstr="var __=[];with(scope){_7("+evar+",function($index,$value){__.push('",
        constr=str.replace( /([\\'])/g, "\\$1" ).replace( /[\r\t\n]/g, " " ).replace(expressReg,function(all,express){
            return "');__.push("+expressfn(express)+");__.push('";
        }),
        endstr="');})} return __.join('')";
        if(trim(constr)=="")return null;
        fn=new Function("scope",fnstr+constr+endstr);
        return fn;
    }
    //还原表达式
    function expressfn(exp){
        return exp
        .split("\\'")
        .join("'")
        .split("&quot;")
        .join('"');
    }
    function nvl(a,b){
        b=b||"";
        return a==null?b:a;
    }
    //初始化变量
    function initVar(scope){
        scope.el.find("[name]").each(function(){
            var _=$(this)
            ,vnames=_.attr("name").split(".")
            ,vl=vnames.length
            ,tobj=scope;
            for(var i=0,t;i<vl;i++){
                t=vnames[i];
                if(i==vl-1){
                    if(!(t in tobj))tobj[t]="";
                    break;
                }
                if(!(t in tobj)){
                    tobj[t]={};
                    tobj=tobj[t];
                }
            }
        });
    }
    //element link code
    function pingy(ctrl){
        var _=$(this),scope;
        if(_.size()==0)return;
        _.hide();
        scope=Scope(_);
        initVar(scope);
        if(ctrl)ctrl(scope);
        complie(scope);
        scope.render(true,function(){_.show();});
        vartoscope(scope);
        return _;
    }
    $.fn.extend({
        pingy:pingy
    });
    return $;
}));