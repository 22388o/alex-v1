import subprocess
from sys import argv
import json

txid = argv[1]
#check transaction
res = subprocess.check_output(f"curl -s https://regtest-2.alexgo.io/extended/v1/tx/{txid} | jq .", shell=True)
json_data = json.loads(res)
print(json.dumps(json_data, indent=4, sort_keys=True))