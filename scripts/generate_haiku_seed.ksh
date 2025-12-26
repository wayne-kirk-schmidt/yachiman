#!/usr/bin/env bash

umask 022

date=$( date +%y%m%d )
time=$( date +%H%M%S )

files=( ./config/themes/* )

count=${#files[@]}
(( count == 0 )) && exit 1

randomfile="${files[RANDOM % count]}"

guide="./config/haiku.instructions.txt"

theme="${randomfile}"

output="./inbox/inbox.${date}.${time}.txt"

script="./scripts/generate_haiku_seed.py"

${script} --instructions "${guide}" --template "${theme}" --agenturl openai --dst "${output}" --number 3 --verbose
