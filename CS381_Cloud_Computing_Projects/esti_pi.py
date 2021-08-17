import sys
from random import random
from operator import add
from pyspark import SparkConf
from pyspark import SparkContext

sc = SparkContext("spark://tao-VirtualBox:7077","esti_pi")

n = 10000000

def sample_points(p):
    x = random() * 2 - 1
    y = random() * 2 - 1
    return 1 if x*x + y*y <= 1 else 0

count = sc.parallelize(range(1, n + 1)).map(sample_points).reduce(add)
string = ("Pi is %f" % (4.0 * count / n))
rdd = sc.parallelize(string.split(" "))
rdd.coalesce(1).saveAsTextFile("hdfs://tao-virtualbox:9000/user/piv4.txt")