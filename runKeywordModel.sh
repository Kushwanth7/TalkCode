#!/bin/bash

. cmd.sh
. path.sh

nj=1

#Prepare the Dictionary for the keyword model
echo "========Preparing the dictionary for the keyword model============"
dir=data/local/dict
mkdir -p $dir

cat $dir/lexicon_words.txt | awk '{ for(n=2;n<=NF;n++){ phones[$n] = 1; }} END{for (p in phones) print p;}' | \
  grep -v SIL | sort > $dir/nonsilence_phones.txt

( echo SIL; echo NSN ) > $dir/silence_phones.txt

echo SIL > $dir/optional_silence.txt

echo -n >$dir/extra_questions.txt

echo '<unk> NSN' | cat - $dir/lexicon_words.txt | sort | uniq > $dir/lexicon.txt

echo
echo "==========Validating the dictionary========"
echo
utils/validate_dict_dir.pl $dir || exit 1

echo
echo "======Preparing the language data========="
echo 

utils/prepare_lang.sh data/local/dict "<unk>" data/local/lang data/lang

echo
echo "==========Completed preparation of prepare lang ========"
echo






