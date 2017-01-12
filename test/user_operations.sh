#!/usr/bin/env bash



actions="apply release"
users="a b c d e f g h i j k l m n o p q r s t u v w x y z"
# Read into array variable.
IFS=' '
action=($actions)
user=($users)
# Count how many elements.
num_actions=${#action[*]}
num_users=${#user[*]}

SECONDS=0

for i in {1..1000}
do
    url="http://127.0.0.1:80/v1/cluster_${action[$((RANDOM%num_actions))]}?user_id=${user[$((RANDOM%num_users))]} "
    echo $url
    curl $url
done

duration=$SECONDS
echo "$(($duration / 60)) minutes and $(($duration % 60)) seconds elapsed."
