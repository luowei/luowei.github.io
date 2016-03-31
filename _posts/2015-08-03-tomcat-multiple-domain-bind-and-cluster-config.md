---
layout: post
title: "Tomcat多域名绑定及集群配置"
keywords: ["维唯为为","tomcat多域名","tomcat域名绑定","tomcat集群"]
description: "Tomcat多域名绑定及集群配置"
category: "Tomcat配置"
tags: ["apache","tomcat","服务器"]
---

{% include JB/setup %}

```
# - 配置Apache虚拟目录

1. 在 /etc/httpd/conf.d 目录中创建 tomcat.conf 文件；
2. 添加以下内容：
## 配置tomcat的常规应用,这里使用 my.wodedata.com 域名
<VirtualHost *:80>   
    ServerName my.wodedata.com 
    ProxyIOBufferSize 8192  
    ProxyRequests Off   
    ProxyVia Full   
    # 把 my.wodedata.com 指向 http://wodedata.com:8080 tomcat应用端口
    ProxyPass / http://wodedata.com:8080/ smax=5 max=20 ttl=120 retry=300   
    ProxyPassReverse / http://wodedata.com:8080/
</VirtualHost>

## 配置独立域名的应用，这里使用 ldcs.wodedata.com 域名
<VirtualHost *:80>   
    ServerName ldcs.wodedata.com 
    ProxyIOBufferSize 8192  
    ProxyRequests Off   
    ProxyVia Full   
    ProxyPass / http://ldcs.wodedata.com:8080/
    ProxyPassReverse / http://ldcs.wodedata.com:8080  
</VirtualHost>

3. 检查apache配置: httpd -t
4. 重启apache服务器: service httpd restart

----------------------------

# - tomcat的WebApp配置域名绑定
1. 上传应用wodedata.war到tomcat根目录下的webapps目录下；
2. 配置tomcat根目录下的conf/server.xml，如下：
## 编辑service/connector结点,添加proxyPort与proxyName
<Connector port="8080" protocol="HTTP/1.1"
               connectionTimeout="20000"
               redirectPort="8443" proxyPort="80" proxyName="my.wodedata.com" />


## 在service/Engine下再添加一个Host
<Host name="ldcs.wodedata.com" appBase="webapps"
       unpackWARs="true" autoDeploy="true"
       xmlValidation="false" xmlNamespaceAware="false">
         <Alias>ldcs.wodedata.com</Alias>

## name与tomcat.conf中配置的ServerName对应；
## appBase为tomcat的webapps目录名；
## Context的docBase为webapps目录下的wodedata；

         <Context path="" docBase="wodedata"  reloadable="true" caseSensitive="false" >
         </Context>

         <Valve className="org.apache.catalina.valves.AccessLogValve" directory="logs"
               prefix="localhost_wodedata_log" suffix=".txt"
               pattern="%h %l %u %t &quot;%r&quot; %s %b" />

</Host>

3. 最后重启tomcat；

--------------------------------

Tomcat集群配置，后续更新。。暂见参考引用。

```

**参考:**

[Apache+Tomcat集群配置:](http://www.iteye.com/topic/1017961)   http://www.iteye.com/topic/1017961

[Tomcat配置一个ip绑定多个域名:](http://blog.csdn.net/freeglad/article/details/2819278) http://blog.csdn.net/freeglad/article/details/2819278  

[apache+tomcat配置:](http://blog.csdn.net/hanghangaidoudou/article/details/8363442)  http://blog.csdn.net/hanghangaidoudou/article/details/8363442