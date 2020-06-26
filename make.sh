#!/bin/bash
for log in logs/*.md;
do
    echo ${log%.md}.html
    pandoc -s -c ../css/style.css -H ./baidu.js $log -o ${log%.md}.html
done