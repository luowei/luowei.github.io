---
layout: post
title: "CentOS上LAMP环境搭建及配置"
keywords: ["维唯为为","LAMP配置","phpMyAdmin","CentOS"]
description: "CentOS上安装LAMP服务器"
category: "LAMP"
tags: ["linux","LAMP","shell脚本"]
---

{% include JB/setup %}

将以下脚本保存为 lamp.sh , 执行 sh lamp.sh 安装。

```

#!/bin/sh

# 参考:
# Shell脚本编程30分钟入门:https://github.com/qinjx/30min_guides/blob/master/shell.md
# nstall JAVA 8 (JDK 8u45) on CentOS/RHEL 7/6/5 and Fedora:http://tecadmin.net/install-java-8-on-centos-rhel-and-fedora/
# CentOS开机自动运行程序的脚本:http://blog.csdn.net/jiedushi/article/details/6767445

# 安装Apache
cd ~
yum install httpd

# 启动apache
service httpd start

# 开启apache的开机自启动
chkconfig httpd on

# ------------------------

cd /opt/
wget --no-cookies --no-check-certificate --header "Cookie: gpw_e24=http%3A%2F%2Fwww.oracle.com%2F; oraclelicense=accept-securebackup-cookie" "http://download.oracle.com/otn-pub/java/jdk/8u45-b14/jdk-8u45-linux-x64.tar.gz"

tar xzf jdk-8u45-linux-x64.tar.gz


# 配置java
cd /opt/jdk1.8.0_45/

alternatives --install /usr/bin/java java /opt/jdk1.8.0_45/bin/java 1
alternatives --install /usr/bin/jar jar /opt/jdk1.8.0_45/bin/jar 1
alternatives --install /usr/bin/javac javac /opt/jdk1.8.0_45/bin/javac 1
alternatives --set jar /opt/jdk1.8.0_45/bin/jar
alternatives --set jar /opt/jdk1.8.0_45/bin/jar
alternatives --set javac /opt/jdk1.8.0_45/bin/javac 

# --config可以选择java的设置
# alternatives --config java 

# 设置环境变量
touch java_env.sh
echo '#!/bin/sh' $'\n' >> java_env.sh
echo 'export JAVA_HOME=/opt/jdk1.8.0_45' >> java_env.sh
echo 'export JRE_HOME=/opt/jdk1.8.0_45/jre' >> java_env.sh
echo 'export PATH=$PATH:/opt/jdk1.8.0_45/bin:/opt/jdk1.8.0_45/jre/bin' >> java_env.sh

source ./java_env.sh
mv ./java_env.sh /etc/profile.d/java_env.sh

# --------------------------

# 安装Tomcat
cd /opt
wget http://www.us.apache.org/dist/tomcat/tomcat-8/v8.0.23/bin/apache-tomcat-8.0.23.tar.gz

tar xzf apache-tomcat-8.0.23.tar.gz


# 设置环境变量
echo "export CATALINA_HOME=\"/opt/apache-tomcat-8.0.23\"" >> ~/.bashrc
source ~/.bashrc


# # Edit conf/tomcat-users.xml file in your editor and paste inside <tomcat-users> </tomcat-users> tags.
# <!-- user manager can access only manager section -->
# <role rolename="manager-gui" />
# <user username="manager" password="_SECRET_PASSWORD_" roles="manager-gui" />

# <!-- user admin can access manager and admin section both -->
# <role rolename="admin-gui" />
# <user username="admin" password="_SECRET_PASSWORD_" roles="manager-gui,admin-gui" />

# 启动tomcat
cd /opt/apache-tomcat-8.0.23
./bin/startup.sh

# 创建开机启动脚本，
cd /etc/init.d
sudo touch tomcat_startup.sh
sudo chmod 755 tomcat_startup.sh
sudo chown luowei:luowei tomcat_startup.sh

echo '
#!/bin/sh

# # Auto Start At Boot
#add for chkconfig
#chkconfig:2345 70 30
#description:tomcat 启动脚本   #脚本描述
#processname:tomcat8          #进程名

/bin/sh /opt/apache-tomcat-8.0.23/bin/startup.sh
' >> tomcat_startup.sh

# 设置开机启动
chkconfig --add tomcat_startup.sh


# # ---------------
cd ~
# 安装Mysql
yum install mysql mysql-server

# 启动Mysql并配置数据库
service mysqld start
/usr/bin/mysql_secure_installation

# 设置mysqld开机自启动
chkconfig mysqld on


# # ---------------
cd ~
# 安装php
yum install php php-common

# 安装php其他第三方库
yum install php-cli php-mysql php-devel php-gd php-mcrypt php-mbstring

# # 查看php模块加载情况
# php -m

# 添加phpinfo测试文件
mkdir /var/www/html/php
chown -R luowei:luowei /var/www/html
echo '<?php echo phpinfo(); ?>' > /var/www.html/php/phpinfo.php

# 重启apache
service httpd restart


# # ---------------
cd ~
# 安装phpMyAdmin
yum install phpmyadmin

# 修改/etc/httpd/config.d/phpMyAdmin.conf
# <Directory /usr/share/phpMyAdmin/>
#    AddDefaultCharset UTF-8

#    <IfModule mod_authz_core.c>
#      # Apache 2.4
#      <RequireAny>
# #       Require ip 127.0.0.1
# #       Require ip ::1
#       Require all granted
#      </RequireAny>
#    </IfModule>
#    <IfModule !mod_authz_core.c>
#      # Apache 2.2
#      Order Deny,Allow
# #     Deny from All
# #     Allow from 127.0.0.1
# #     Allow from ::1
#      Allow from all
#    </IfModule>
# </Directory>

# 重启apache
service httpd restart




```
