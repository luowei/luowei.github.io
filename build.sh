#!/bin/sh

RUBYOPT='-W:no-deprecated'

# bundle exec jekyll build --incremental -b "/"

bundle exec jekyll build -b "/"

# # 编译gitee
# bundle exec jekyll build -b "/" --config _config_gitee.yaml

