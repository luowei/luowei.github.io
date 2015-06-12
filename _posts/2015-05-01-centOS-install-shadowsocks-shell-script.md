---
layout: post
title: "CentOS上安装ShadowSocks脚本"
keywords: ["维唯为为","shadowSocks","VPN","CentOS"]
description: "CentOS上安装ShadowSocks，作为代码服务器"
category: "linux"
tags: ["linux","ShadowSocks","shell脚本"]
---

{% include JB/setup %}

将以下脚本保存为 shadowsocks.sh , 执行 sh shadowsocks.sh 安装。

```

#!/bin/sh

# 参考：
# Pip和Shadowsocks的安装配置教程:http://www.guance.com/611.html
# CentOS6零基础配置shadowsocks服务端完整教程:http://hazelzhu.com/archives/1568
# Linux的简单shell脚本中修改文件操作:http://jsczxy2.iteye.com/blog/673910
# Linux Shell编程入门:http://www.cnblogs.com/suyang/archive/2008/05/18/1201990.html
# centOS防火墙iptables的设置教程:http://www.jb51.net/os/RedHat/68744.html
# CentOS配置防火墙操作实例(启、停、开、闭端口):http://blog.csdn.net/jemlee2002/article/details/7042991


# 安装所需组件
yum install -y wget tar gcc gcc-c++ openssl openssl-devel pcre-devel python-devel libevent autoconf libtool

echo "==== 所需组件安装成功"


# 升级python
cd /root
wget http://www.python.org/ftp/python/2.7.6/Python-2.7.6.tgz
tar zxvf Python-2.7.6.tgz
cd Python-2.7.6
./configure
make
make install

echo "==== 升级到python-2.7.6 成功"


# 设置python2.7.6为默认版本
mv /usr/bin/python /usr/bin/python2.6.6
ln -s /usr/local/bin/python2.7 /usr/bin/python

# 修改一下yum依赖,把第1行的 python 替换成 python-2.6.6
cp /usr/bin/yum /usr/bin/yum.bak
sed -i '1s/python/python2.6.6/g' /usr/bin/yum

cd /root

# 安装setputools
wget http://pypi.python.org/packages/2.7/s/setuptools/setuptools-0.6c11-py2.7.egg –no-check-certificate
sh setuptools-0.6c11-py2.7.egg

# 安装pip
wget http://pypi.python.org/packages/source/p/pip/pip-1.5.4.tar.gz –no-check-certificate
tar zxvf pip-1.5.4.tar.gz
cd pip-1.5.4
python setup.py install

# 安装swig
cd /root
wget http://jaist.dl.sourceforge.net/project/swig/swig/swig-3.0.0/swig-3.0.0.tar.gz
tar zxvf swig-3.0.0.tar.gz
cd swig-3.0.0
./configure
make
make install

# 安装shadowsocks
pip install shadowsocks

# 创建配置文件
mkdir /opt/shadowsocks
cd /opt/shadowsocks
touch config.json
cat > config.json <<!
{
    "server":"0.0.0.0",
    "server_port":8388,
    "local_address": "127.0.0.1",
    "local_port":1080,
    "password":"luowei",
    "timeout":300,
    "method":"aes-256-cfb",
    "fast_open": false,
    "workers": 1
}
!


# 安装M2Crypto
cd /root
pip install M2Crypto

# 安装easy_install并安装greenlet
cd /root
wget -q http://peak.telecommunity.com/dist/ez_setup.py
python ez_setup.py
easy_install greenlet

## 安装greenlet
# pip install greenlet

# 安装Gevent
pip install gevent

# 开启server_port 8388
iptables -A INPUT -m state --state NEW -m tcp -p tcp --dport 8388 -j ACCEPT
/etc/rc.d/init.d/iptables save

# 重启防火墙iptables
service iptables restart


# # 命令行参数（服务器端启动命令）
# ssserver -c /etc/shadowsocks.json

# # 后台运行Shadowsocks
# nohup ssserver -c /opt/shadowsocks/config.json > /dev/null 2>&1 &

# # kill掉shadowsocks的进程
# killall ssserver



```
