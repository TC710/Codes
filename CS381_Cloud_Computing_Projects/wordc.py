import sys
from pyspark import SparkConf
from pyspark import SparkContext

sc = SparkContext("spark://tao-VirtualBox:7077","Word Count")
text_file = sc.textFile("hdfs://tao-virtualbox:9000/user/1342-0.txt")
line = text_file.flatMap(lambda line: line.lower().split(" "))
maps = line.map(lambda word: (word, 1))
reducer = maps.reduceByKey(lambda a, b: a + b)
most_use =reducer.takeOrdered(20,lambda x:-x[1])
list_to_rdd = sc.parallelize(most_use)
list_to_rdd.coalesce(1).saveAsTextFile("hdfs://tao-virtualbox:9000/user/coutputv6.txt")