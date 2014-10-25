---
layout: post
title: "两数相乘小数位无限制"
keywords: ["维唯为为"]
description: "两个数相乘，小数点后位数没有限制，请写一个高精度算法"
category: "puzzle"
tags: ["算法问题"]
---

{% include JB/setup %}

两个数相乘，小数点后位数没有限制，请写一个高精度算法

> 解题思路：将两组小数用数组存储，计算机两组小数点位数的总和，将小数点剔除，将小数点后面的位数向前移动一位。即开始求两个大整数的乘积。用递归的思路输出，得到的乘积，同时通过计算的小数点的位数，来判定什么时候输出小数点。

> 求两个大整数的乘积的思路：用结点来存储乘积的每一位，可以是数值不受限制。


**关键函数：**

	istream&getline(char *pch,int nCount,char delime='\n')
 	extern char * strchr(char *str,char character)
 	extern char * strrev(char *s)

**实现：**

```
#include<iostream>     
using   namespace   std;     
#define   MAX   10000     
struct   Node{     
    int   data;     
    Node   *next;     
};     
void   output(Node   *head,int   pos)     
{     
    if(!head->next&&!head->data)return;     
    output(head->next,pos-1);     
    cout<<head->data;   
    if(!pos)cout<<".";   
}     
void   Mul(char   *a,char   *b,int   pos)                     
{     
    char   *ap=a,*bp=b;     
    Node   *head=0;     
    head=new   Node;head->data=0,head->next=0;       //头     
    Node   *p,*q=head,*p1;     
    int   temp=0,temp1,bbit;     
    while(*bp)                                 //若乘数不为空   ,继续.     
    {     
            p=q->next;p1=q;     
            bbit=*bp-48;                     //把当前位转为整型     
            while(*ap||temp)                         //若被乘数不空,继续     
            {     
                    if(!p)                         //若要操作的结点为空,申请之     
                    {     
                            p=new   Node;     
                            p->data=0;     
                            p->next=0;     
                            p1->next=p;     
                    }     
                    if(*ap==0)temp1=temp;     
                    else   {   temp1=(p1->data)+(*ap-48)*bbit+temp;ap++;   }     
                    p1->data=temp1%10;         //留当前位     
                    temp=temp1/10;         //进位以int的形式留下.     
                    p1=p;p=p->next;                                   //被乘数到下一位     
            }     
            ap=a;bp++;q=q->next;                                 //q进下一位     
    }     
    p=head;     
    output(p,pos);                                       //显示     
    cout<<endl;     
    while(head)                                   //释放空间     
    {     
                    p=head->next;     
                    delete   head;     
                    head=p;     
    }     
}     
int   main()     
{     
    cout<<"请输入两个数"<<endl;     
    char   test1[MAX],test2[MAX],*p;     
    int   pos=0;   
    cin.getline(test1,MAX,'\n');     
    cin.getline(test2,MAX,'\n');   
    if(p=strchr(test1,'.'))   
    {   
            pos+=strlen(test1)-(p-test1)-1;     
            do   
            {   
                    p++;   
                    *(p-1)=*p;   
            }while(*p);   
    }                   
    if(p=strchr(test2,'.'))   
    {   
            pos+=strlen(test2)-(p-test2)-1;   
            do   
            {   
                    p++;   
                    *(p-1)=*p;   
            }while(*p);   
    }           
    Mul(strrev(test1),strrev(test2),pos);     
    system("PAUSE");     
    return   0;     
}
```


