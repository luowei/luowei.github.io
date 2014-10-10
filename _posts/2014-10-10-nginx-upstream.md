---
layout: post
title: "nginx的负载均衡配置"
keywords: ["维唯为为","nginx","负载均衡"]
description: "nginx的负载均衡配置"
category: "tutorials"
tags: ["负载均衡","教程","nginx"]
---

{% include JB/setup %}

	Nginx负载均衡通过upstream实现,同时Nginx还支持多组的负载均衡,可以配置多个upstream来服务于不同的Server.

- down 表示单前的server暂时不参与负载 
- weight  默认为1.weight越大，负载的权重就越大。 
- max_fails ：允许请求失败的次数默认为1.当超过最大次数时，返回--- proxy_next_upstream 模块定义的错误 
- fail_timeout:max_fails 次失败后，暂停的时间。 
- backup： 其它所有的非backup机器down或者忙的时候，请求backup机器。所以这台机器压力会最轻。

**nginx的upstream目前支持4种方式的分配** 

 1. 轮询（默认）
      每个请求按时间顺序逐一分配到不同的后端服务器，如果后端服务器down掉，能自动剔除。 
 2. weight
      指定轮询几率，weight和访问比率成正比，用于后端服务器性能不均的情况。 
 3. ip_hash
      每个请求按访问ip的hash结果分配，这样每个访客固定访问一个后端服务器，可以解决session的问题。  
 4. fair（第三方）
      按后端服务器的响应时间来分配请求，响应时间短的优先分配。  
 5. url_hash（第三方）
 
**配置conf.d(上代码)：**

```
worker_processes  1;
error_log  logs/rtmp_error.log debug;
pid			logs/nginx.pid;

events {
    worker_connections  1024;
}

#http config
#include conf.d/http.conf;


http {
    include       mime.types;
    default_type  application/octet-stream;

	#通过ip设置访问权限
	#allow 192.168.0.0/24;
	#allow 127.0.0.1;
	#deny all;
	
    sendfile        on;
    keepalive_timeout  65;

    #gzip  on;
	
	
	#upstream config(负载均衡配置)
	
	#定义负载均衡设备的 Ip及设备状态 
	upstream myServer {   

		# 不同的ip或者端口指定不同的server
		server 127.0.0.1:9090 down; 
		server 127.0.0.1:8080 weight=2; 
		server 127.0.0.1:6060; 
		server 127.0.0.1:7070 backup; 
	}

	# upstream 每个设备的状态:
	# down 表示单前的server暂时不参与负载 
	# weight  默认为1.weight越大，负载的权重就越大。 
	# max_fails ：允许请求失败的次数默认为1.当超过最大次数时，返回proxy_next_upstream 模块定义的错误 
	# fail_timeout:max_fails 次失败后，暂停的时间。 
	# backup： 其它所有的非backup机器down或者忙的时候，请求backup机器。所以这台机器压力会最轻。

	server {
			listen       80;
			server_name  localhost;
			
			location / {
				#在需要使用负载的Server节点下添加
				proxy_pass http://myServer;
				
				#root   html;
				#index  index.html index.htm;
			}
			error_page   500 502 503 504  /50x.html;
			location = /50x.html {
				root   html;
			}
			
	}

	#监听6060的服务器
	server {
			listen       6060;
			server_name  127.0.0.1;
			
			location / {	
				root   html;
				index  6060.html;
			}
	}

	#监听7070的服务器
	server {
			listen       7070;
			server_name  127.0.0.1;
			
			location / {	
				root   html;
				index  7070.html;
			}
	}

	#8080端口让tomcat来监听服务器
	#server {
	#        listen       8080;
	#        server_name  127.0.0.1;
	#		
	#        location / {	
	#			root   html;
	#            index  index.html index.htm;
	#        }
	#}
	

}
```