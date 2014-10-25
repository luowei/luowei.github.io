---
layout: post
title: "排序及二分查找"
keywords: ["维唯为为"]
description: "排序及二分查找"
category: "puzzle"
tags: ["算法问题"]
---

{% include JB/setup %}


> 1. 冒泡排序:是对所有相邻记录的关键字值进行比效，如果是逆顺（a[j]>a[j+1]），则将其交换，最终达到有序化;

> 2. 选择排序:第一次从R[0]-R[n-1]中选取最小值，与R[0]交换，第二次从R[1]-R[n-1]中选取最小值，与R[1]交换，第三次从R[2]-R[n-1]中选取最小值，与R[2]交换，...，第i次从R[i-1]-R[n-1]中选取最小值，与R[i-1]交换，...第n-1次从R[n-2]-R[n-1]中选取最小值，与R[n-2]交换，总共通过n-1次，得到一个按排序码从小到大排列的有序序列。

> 3. 插入排序:把n个待排序的元素看成为一个有序表和一个无序表，开始时有序表中只包含一个元素，无序表中包含有n-1个元素，排序过程中每次从无序表中取出第一个元素，把它的排序码依次与有序表的排序码进行比较，将它插入到有序表中的适当位置，使之成为新的有序表。

> 4. 快速排序：假设要排序的数组是A[1]……A[N]，首先任意选取一个数据（通常选用第一个数据）作为关键数据，然后将所有比它的数都放到它前面，所有比它大的数都放到它后面，这个过程称为一躺快速排序。
 
#### Java实现
```
class Bubble   
{   
    //测试   
    public void test(int a)   
    {   
        a++;   
    }   
       
    //冒泡排序   
    public void sort(int arr[])   
    {   
        int temp=0;   
        //外层循环,决定一共走几趟   
        for(int i=0;i<arr.length-1;i++)   
        {   
            //内层循环，开始逐个比较，如果发现前一个数比后一个数大，则交换    
            for(int j=0;j<arr.length-1-i;j++)   
            {   
                if(arr[j]>arr[j+1])   
                {   
                    //换位   
                    temp=arr[j];   
                    arr[j]=arr[j+1];   
                    arr[j+1]=temp;   
                }   
            }   
        }   
    }   
}   
  
class Select   
{   
    //选择排序   
    public void sort(int arr[])   
    {   
        int temp=0;//临时变量   
        for(int j=0;j<arr.length-1;j++)   
        //j<arr.length说明当只剩最后一个数没比较时，不必再比较了   
        {   
            //假设第j个数是最小的数   
            int min=arr[j];   
            //记录最小数的下标   
            int minIndex=j;   
            for(int k=j+1;k<arr.length;k++)   
            //k<arr.length说明只剩两个数未比较时，最后一个数要参与比较   
            {   
                if(min>arr[k])   
                {   
                    //修改最小   
                    min=arr[k];   
                    minIndex=k;   
                }   
            }   
            //当退出内层for循环时，就找到这次的最小值   
            temp=arr[j];   
            arr[j]=arr[minIndex];   
            arr[minIndex]=temp;   
        }   
    }   
}   
  
//插入排序   
class InsertSort   
{   
    //插入排序方法   
    public void sort(int arr[])   
    {   
        for(int i=1;i<arr.length;i++)   
        {   
            int insertVal=arr[i];   
            //insertVal准备和前一个数比较   
            int index=i-1;   
            while(index>=0&&insertVal<arr[index])   
            {   
                //将把arr[index]向后移动一位   
                arr[index+1]=arr[index];   
                //让index向前移动   
                index--;   
            }   
            //将insertVal插入到行当 位置   
            arr[index+1]=insertVal;   
        }   
    }   
}   
  
//快速排序   
class QuickSort   
{   
    public void sort(int left,int right,int[] array)   
    {   
        int l=left;//左边   
        int r=right;//右边   
        int pivot=array[(left+right)/2];//中间的作为隔板数   
        int temp=0;   
        while(l<r)   
        {   
            while(array[l]<pivot) l++;   
            while(array[r]>pivot) r--;   
            if(l>=r) break;   
            temp=array[l];   
            array[l]=array[r];   
            array[r]=temp;   
               
            if(array[l]==pivot) --r;   
            if(array[r]==pivot) ++l;   
        }   
        if(l==r)   
        {   
            l++;   
            r--;   
        }   
        if(left<r) sort(left,r,array);   
        if(right>l) sort(l,right,array);            
    }   
}  

//二分查找   
class BinaryFind   
{   
    public void find(int leftIndex,int rightIndex,int val,int[] arr)   
    {   
        //首先找到中间的数   
        int midIndex=(rightIndex+leftIndex)/2;   
        int midVal=arr[midIndex];   
        if(rightIndex>=leftIndex)   
        {   
            //如果要找的数比midVal大   
            if(midVal>val)   
            {   
                //在arr的左边数中找   
                find(leftIndex,midIndex-1,val,arr);//递归   
            }   
            else if(midVal<val)   
            {   
                //在arr的右边的数找   
                find(midIndex+1,rightIndex,val,arr);//递归   
            }   
            else if(midVal==val)   
            {   
                System.out.println("找到下标"+midIndex);   
            }   
        }   
        else  
        {   
            System.out.println("没有找到！");   
        }   
    }   
}
```


#### Objective-C实现

**首先是header文件：**

```
#import <Foundation/Foundation.h>  

@interface Sort : NSObject{  

}  
//冒泡排序  
-(void)bunbleSortWithArray:(NSArray *)aData;  
//选择排序  
-(void)selectSortWithArray:(NSArray *)aData;  
//插入排序  
-(void)insertSortWithArray:(NSArray *)aData;  
//快速排序，对冒泡排序的一种改进  
-(void)quickSortWithArray:(NSArray *)aData;  
-(void)swapWithData:(NSMutableArray *)aData index1:(NSInteger)index1 index2:(NSInteger)index2;  
@end  
```


**接着是实现：**

```
#import "Sort.h"  

@interface Sort()  
-(void)quickSortWithArray:(NSArray *)aData left:(NSInteger)left right:(NSInteger)right;  
@end  

@implementation Sort  

- (id)init  
{  
    self = [super init];  
    if (self) {  
        // Initialization code here.  
    }  

    return self;  
}  

-(void)bunbleSortWithArray:(NSArray *)aData{  
    NSMutableArray *data = [[NSMutableArray alloc]initWithArray:aData];  
    for (int i=0; i<[data count]-1; i++) {  
        for (int j =0; j<[data count]-1-i; j++) {  
            if ([data objectAtIndex:j] > [data objectAtIndex:j+1]) {  
                [self swapWithData:data index1:j index2:j+1];  
            }  
        }  
    }  
    NSLog(@"冒泡排序后的结果：%@",[data description]);  
}  

-(void)selectSortWithArray:(NSArray *)aData{  
    NSMutableArray *data = [[NSMutableArray alloc]initWithArray:aData];  
    for (int i=0; i<[data count]-1; i++) {  
        int m =i;  
        for (int j =i+1; j<[data count]; j++) {  
            if ([data objectAtIndex:j] < [data objectAtIndex:m]) {  
                m = j;  
            }  
        }  
        if (m != i) {  
            [self swapWithData:data index1:m index2:i];  
        }  
    }  
    NSLog(@"选择排序后的结果：%@",[data description]);  
}  

-(void)insertSortWithArray:(NSArray *)aData{  
    NSMutableArray *data = [[NSMutableArray alloc]initWithArray:aData];  
    for (int i = 1; i < [data count]; i++) {  
        id tmp = [data objectAtIndex:i];  
        int j = i-1;  
        while (j != -1 && [data objectAtIndex:j] > tmp) {  
            [data replaceObjectAtIndex:j+1 withObject:[data objectAtIndex:j]];  
            j--;  
        }  
        [data replaceObjectAtIndex:j+1 withObject:tmp];  
    }  
    NSLog(@"插入排序后的结果：%@",[data description]);  
}  

-(void)quickSortWithArray:(NSArray *)aData{  
    NSMutableArray *data = [[NSMutableArray alloc] initWithArray:aData];  
    [self quickSortWithArray:data left:0 right:[aData count]-1];  
    NSLog(@"快速排序后的结果：%@",[data description]);  

}  

-(void)quickSortWithArray:(NSMutableArray *)aData left:(NSInteger)left right:(NSInteger)right{  
    if (right > left) {  
        NSInteger i = left;  
        NSInteger j = right + 1;  
        while (true) {  
            while (i+1 < [aData count] && [aData objectAtIndex:++i] < [aData objectAtIndex:left]) ;  
            while (j-1 > -1 && [aData objectAtIndex:--j] > [aData objectAtIndex:left]) ;  
            if (i >= j) {  
                break;  
            }  
            [self swapWithData:aData index1:i index2:j];  
        }  
        [self swapWithData:aData index1:left index2:j];  
        [self quickSortWithArray:aData left:left right:j-1];  
        [self quickSortWithArray:aData left:j+1 right:right];  
    }  
}  


//-(void)dealloc{  
//}  

-(void)swapWithData:(NSMutableArray *)aData index1:(NSInteger)index1 index2:(NSInteger)index2{  
    NSNumber *tmp = [aData objectAtIndex:index1];  
    [aData replaceObjectAtIndex:index1 withObject:[aData objectAtIndex:index2]];  
    [aData replaceObjectAtIndex:index2 withObject:tmp];  
}  

@end  
```


**然后写main函数测试：**

```
#import <Foundation/Foundation.h>  
#import "Sort.h"  

#define kSize 20  
#define kMax 100  

int main (int argc, const char * argv[])  
{  

    // insert code here...  
    NSLog(@"Hello, World!");  

    NSMutableArray *data = [[NSMutableArray alloc] initWithCapacity:kSize];  

    for (int i =0;i<kSize;i++) {  
        u_int32_t x = arc4random() % kMax;//0~kMax  
        NSNumber *num = [[NSNumber alloc] initWithInt:x];  
        [data addObject:num];  
    }  

    NSLog(@"排序前的数据：%@",[data description]);  

    Sort *sort = [[Sort alloc] init];  
    [sort bunbleSortWithArray:data];  
    [sort selectSortWithArray:data];  
    [sort insertSortWithArray:data];  
    [sort quickSortWithArray:data];  
    return 0;  
}
```


