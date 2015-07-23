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

      未完待续...

```