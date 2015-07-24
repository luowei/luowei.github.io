---
layout: post
title: "CentOS环境下Apache虚拟目录及负载均衡配置"
keywords: ["维唯为为","Apache配置","虚拟目录","负载均衡"]
description: "CentOS环境下Apache虚拟目录及负载均衡配置"
category: "Apache配置"
tags: ["apache","linux","服务器"]
---

{% include JB/setup %}

```
# 创建数据库
CREATE DATABASE IF NOT EXISTS rootls DEFAULT CHARSET utf8 COLLATE utf8_general_ci

# 创建用户并授权
CREATE USER 'rootls'@'localhost' IDENTIFIED BY 'luowei123456'; 
GRANT ALL ON rootls.* TO 'rootls'@'localhost' ;

# 设置密码
# Set PASSWORD for rootls@localhost = password('luowei123456') ;

# 登录rootls
mysql -h localhost -u rootls -p

# 导入sql文件
use rootls
set names utf8;
source /var/www/zips/rootls.sql


# 搭建CMS
# 创建wodedata用户
CREATE USER 'wodedata'@'localhost' IDENTIFIED BY 'wodedata123456'; 

# 给用户wodedata授予wodedata数据库的权限
GRANT ALL ON wodedata.* TO 'wodedata'@'localhost' ;

# 取消息在rootls数据库上的授权
# revoke all on rootls.* from wodedata@localhost ;


# 下载gpEasy CMS
# wget http://www.gpeasy.com/Special_gpEasy?cmd=download


# 下载e107 CMS
# wget http://jaist.dl.sourceforge.net/project/e107/e107/e107%20v2.0%20beta1/e107_2.0_full_beta1.zip



# 备份host文件
cp /etc/hosts /etc/host.bak

# 追加一行
cat >> /etc/hosts <<!
127.0.0.1   wodedata.com 
127.0.0.1   bbs.wodedata.com
127.0.0.1   rootls.com
!

#在万网添加一条对bbs.wodedata.com的解析记录,
#然后再用以下方式添加ServerName，并配相应的虚拟目录

# 在conf.d下添加rootls.conf配置文件
vi /etc/httpd/conf.d/rootls.conf

# 编辑
# ServerName bbs.wodedata.com:80
<VirtualHost *:80>
    ServerAdmin luowei@rootls.com
    ServerName bbs.wodedata.com
    ServerAlias bbs.wodedata.com rootls.com  #多个域名指定同一站点
    
    DocumentRoot /var/www/html/rootls
    <Directory "/var/www/html/rootls">
        Options Indexes FollowSymLinks MultiViews
        AllowOverride All
        Order allow,deny
        Allow from all
    </Directory>

    ErrorLog /var/www/html/rootls/logs/error.log
    CustomLog /var/www/html/rootls/logs/rootls.log combined

</VirtualHost>

# 添加检查配置
apachectl configtest
#重启
apachectl restart


# 配置不同的端口运行不同的站点
# 完网添加 my.wodedata.com 域名解析记录；
# 然后在 /etc/httpd/conf.d 添加配置文件
sudo vi /etc/httpd/conf.d/tomcat.conf

# 并编辑添加虚拟主机(以端口转发形式)):
<VirtualHost *:80>   
    ServerName java.wodedata.com 
    ProxyIOBufferSize 8192  
    ProxyRequests Off   
    ProxyVia Full   
    ProxyPass / http://wodedata.com:8080/ smax=5 max=20 ttl=120 retry=300   
</VirtualHost>  

# Apache + Tomcat 负载均衡配置参见以下
Apache+tomcat均衡负载配置新小结:http://liangzhijian.iteye.com/blog/1462668
Apache + Tomcat 配置多个应用:http://www.blogjava.net/sealyu/archive/2008/08/25/224326.html
实战Apache+Tomcat集群和负载均衡:http://www.cnblogs.com/qqzy168/archive/2013/08/03/3199237.html


```
