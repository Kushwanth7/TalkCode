#!/bin/bash

. cmd.sh
. path.sh

nj=1
lm_order=1

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

echo "=======Making lm.arpa======"
echo
local=data/local
mkdir -p $local/tmp

loc=`which ngram-count`;
if [ -z $loc ]; then
  if uname -a | grep 64 >/dev/null; then # some kind of 64 bit...
    sdir=$KALDI_ROOT/tools/srilm/bin/i686-m64
  else
    sdir=$KALDI_ROOT/tools/srilm/bin/i686
  fi
  if [ -f $sdir/ngram-count ]; then
    echo Using SRILM tools from $sdir
    export PATH=$PATH:$sdir
  else
    echo You appear to not have SRILM tools installed, either on your path,
    echo or installed in $sdir.  See tools/install_srilm.sh for installation
    echo instructions.
    exit 1
  fi
fi

ngram-count -order $lm_order -write-vocab $local/tmp/vocab-full.txt -wbdiscount -text $local/corpus.txt -lm $local/tmp/lm.arpa

echo "=======Completed making lm.arpa=========="



