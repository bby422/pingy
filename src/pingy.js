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
    ,nullfn=function(){}
    ,scope
    ,t_vars//临时变量
    ,feiScope=["el","render","extend","_7","watch","_"]//不允许定义在scope上的属性
    ,varReg=/[a-zA-Z$_][a-zA-Z0-9$_\.]*/g//匹配变量
    ,q_onReg=/y-on[a-zA-Z0-9]+///绑定事件表达式
    ,expressReg=/\{\{([^\}]*)\}\}/g; //匹配表达式
    
    function Scope(root){
        var _=this;
        if(!(_ instanceof Scope))return new Scope(root);
        _.extend({
            _:{
                nodes:[],
                varNodeMap:{},//变量 node映射
                watchMap:{}//监控映射
            },
            el:root
        });
    }
    extend(Scope.prototype,{
        render:function(rvar){
            var _=this;
            scope=_;
            render(rvar);
            return _;
        },
        extend:function(model){
            var _=this;
            extend(_,model);
            return _;
        },
        watch:function(varname,fn){
            this._.watchMap[varname]=fn;
        },
        _7:each//遍历
    });
    //编译表达式
    function complie(rootnode){
        each(rootnode.childNodes,function(i,node){
           switch(node.nodeType){
                case 1: //正常节点
                    complieNodeType1(node);
                    break;
                case 3: //文本节点
                     complieNodeType3(node);
                     break;
           }
          
        });
    }
    //正常节点
    function complieNodeType1(node){
        var ctne=true;//continue
        each(node.attributes, function(i, attr){
            var attrName = attr.name//属性名
            ,val=trim(nvl(attr.value))
            ,fn
            ,type=1;
            if(attrName=="y-each"){//遍历
                type=70;
                ctne=false;
                fn=buildeach(node.innerHTML,val);
                t_vars=[trim(val)];
            }else if(q_onReg.test(attrName)){
                $(node).on(attrName.split("y-on").join(""),scope[val]);
                return;
            }else if(attrName=="value"){
                type=71;
                fn=build(val);
            }else if(attrName=="y-hide"){
                type=72;
                fn=buildHide(val);                
            }else{
                fn=build(val); 
            }
            
            if(fn){
                scope._.nodes.push({type:type,node:node,fn:fn,attr:attrName});
                each(t_vars,function(i,t){
                    if(scope._.varNodeMap[t]==null)scope._.varNodeMap[t]=[scope._.nodes.length-1];
                    else scope._.varNodeMap[t].push(scope._.nodes.length-1);
                });
            }
        });
         if(node.childNodes.length&&ctne)complie(node);
    }
    //文本节点
    function complieNodeType3(node){
       var fn,text=trim(node.textContent);
        if(text!="")fn=build(nvl(text));
        if(fn){
            scope._.nodes.push({type:3,node:node,fn:fn});
            each(t_vars,function(i,t){
                if(scope._.varNodeMap[t]==null)scope._.varNodeMap[t]=[scope._.nodes.length-1];
                else scope._.varNodeMap[t].push(scope._.nodes.length-1);
            });
        }
    }
    function triggerWatch(varname){
        for(var key in scope._.watchMap){
            if(varname==null)scope._.watchMap[key]();
            else if(varname==key){
                scope._.watchMap[key]();
            }else if(varname.indexOf(key+".")==0){
                scope._.watchMap[key]();
            }
        }
    }
    //渲染页面 渲染指定变量相关 多个以逗号隔开
    function render(rvar){
        var nodes1=scope._.nodes;
        if(rvar){
            nodes1=[];
            each(rvar.split(","),function(i,t){
                triggerWatch(t);
                for(var key in scope._.varNodeMap){
                    var tt=trim(t),tkey=trim(key);
                    if(tt==tkey){
                        appendNodes(nodes1,scope._.varNodeMap[key]);
                    }else if(tkey.indexOf(tt+".")==0){
                        appendNodes(nodes1,scope._.varNodeMap[key]);
                    }
                }
            });
        }else triggerWatch();
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
                    if(t.fn(scope))$(t.node).hide();
                    else $(t.node).show();
                    break;    
            }
        });
    }
    function appendNodes(n1,n2){
        for(var i=0,l=n2.length,t;i<l;i++){
            t=scope._.nodes[n2[i]];
            if(n1.indexOf(t)==-1)n1.push(t);
        }
    }
    //复制对象
    function clone(original){
        if(typeof(original)!='object') return original; 
        if(original==null) return original; 
        var obj={};
        for(var key in original)obj[key]=clone(original[key]);
        return obj;
    }
    //绑定变量
    function onchange_(){
        var runn=true,scope1=scope;
        scope1.el.on("keyup change",function(e){
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
                scope1.el.find("[name="+name+"][type=checkbox]:checked").each(function(i,t){
                    val.push($(t).val());
                });
            }
            fn=new Function("scope","val","scope."+name+"=val;");
            fn(scope1,val);
            scope1.render(name);
        });
        //反复思考 还是决定第一次不要全盘初始化
        // scope.el.find("input,select").trigger("change");
    }
    //勾践表达式
    function build(str){
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
    //y-hide
    function buildHide(express){
        var fn,vars;
        t_vars=[];
        fn=new Function("scope","with(scope){return "+express+";}");
        vars=nvl(express).match(varReg);
        each(vars,function(i,t){t_vars.push(t)});
        return fn;
    }
    //y-each
    function buildeach(str,evar){
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
    //element link code
    function pingy(ctrl){
        var _=$(this);
        scope=Scope(_);
        if(ctrl)ctrl(scope);
        complie(scope.el.get(0));
        scope.render();
        onchange_();
        return _;
    }
    $.fn.extend({
        pingy:pingy
    });
    return $;
}));