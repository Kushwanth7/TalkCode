#!/bin/bash

. path.sh
. cmd.sh

local=data/local
lang=data/lang

echo
echo "======Making G.fst ========"
echo

cat $local/tmp/lm.arpa | arpa2fst - | fstprint | utils/eps2disambig.pl | utils/s2eps.pl | fstcompile --isymbols=$lang/words.txt --osymbols=$lang/words.txt --keep_isymbols=false --keep_osymbols=false | fstrmepsilon | fstarcsort --sort_type=ilabel > $lang/G.fst

echo "====Completed making the G.fst======="
echo

echo "========= Validate the language directory created"
echo
utils/validate_lang.pl --skip-determinization-check data/lang




