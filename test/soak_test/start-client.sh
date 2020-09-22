#!/bin/sh

PID=$$

node map_soak_test.js $1 > client-${PID}-out.log 2>client-${PID}-err.log &
