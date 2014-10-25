---
layout: post
title: "用宏比较两数大小"
keywords: ["维唯为为"]
description: "定义一个宏，比较两个数a、b的大小"
category: "puzzle"
tags: ["算法问题"]
---

{% include JB/setup %}

请定义一个宏，比较两个数a、b的大小，不能使用大于、小于、if语句 .

    方法一：
    #define max(a,b) ((((long)((a)-(b)))&0x80000000)?(b):(a))  
    若a>b，则a-b的二进制最高位为0，与上任何数还是0，所以大数为a；
    否则，a-b为负数，最高位为1，与上0x80000000（最高位为1其他为0）之后为1，所以此时最大数为b。

    方法二：
    #define max(a,b) ((((a)-(b))&(1<<31))?(b):(a)) 
 
    方法三：
    #define max(a,b) (((abs((a)-(b)))==((a)-(b)))?(a):(b))

