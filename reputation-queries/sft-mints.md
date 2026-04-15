db.daoEventCollection.countDocuments({ event: 'sft_mint' });
db.daoEventCollection.find({ event: 'big-claim' });

## Rewards in V2 From V1

Rewards participation in V1 with new tokens

db.daoEventCollection.aggregate([
	{
		$match: {
			event: 'big-claim'
		}
	},
	{
		$group: {
			_id: '$user',
			totalAmount: { $sum: '$amount' },
			claimCount: { $sum: 1 }
		}
	},
	{
		$project: {
			_id: 0,
			user: '$_id',
			totalAmount: 1,
			claimCount: 1
		}
	},
	{
		$sort: {
			user: 1
		}
	}
]);
[
	{
		totalAmount: 1096093643,
		claimCount: 3,
		user: 'SP167Z6WFHMV0FZKFCRNWZ33WTB0DFBCW9QRVJ627'
	},
	{
		totalAmount: 34722222,
		claimCount: 1,
		user: 'SP1KFDTNWYHYRJP7QP342KCFC0T2FXMKN5Z7ZNVX9'
	},
	{
		totalAmount: 593019005,
		claimCount: 2,
		user: 'SP22SW60674C0V6B5E234C7ZD2YR8WXKXXVC48GZR'
	},
	{
		totalAmount: 1096093643,
		claimCount: 3,
		user: 'SP246C0KRV7HKXMRB0H7Y6HCYGRCTZMVB9KP3391R'
	},
	{
		totalAmount: 1169166553,
		claimCount: 3,
		user: 'SP2XFH8D1MM2G11C0S6AZRSNP031RAY92XCARPRSQ'
	},
	{
		totalAmount: 16795102617,
		claimCount: 3,
		user: 'SP2YBH2S583CD60NYJHN165WJQDNDMPH69CZAQ78B'
	},
	{
		totalAmount: 3740954643,
		claimCount: 3,
		user: 'SP2Z2CBMGWB9MQZAF5Z8X56KS69XRV3SJF4WKJ7J9'
	},
	{
		totalAmount: 4092082942,
		claimCount: 3,
		user: 'SP3HAHEV768GAMP34MTEC83PJ4PG6ZSGBX52CR6XQ'
	},
	{
		totalAmount: 3750913741,
		claimCount: 2,
		user: 'SPA8AHVNV690M9G555C614YZYMYXD3X5RQE34S31'
	},
	{
		totalAmount: 6638749385,
		claimCount: 3,
		user: 'SPEZD95XQ194X67C1QJW4PHKDG8F5D66ZCT8BY29'
	},
	{
		totalAmount: 876874915,
		claimCount: 3,
		user: 'SPQE3J7XMMK0DN0BWJZHGE6B05VDYQRXRMDV734D'
	}
];

Averages

Results
✅ Min

34,722,222

✅ Max

16,795,102,617

✅ Average (mean)

≈ 3,096,936,301


db.daoEventCollection.aggregate([
	{
		$match: {
			event: 'sft_mint'
		}
	},
	{
		$group: {
			_id: {
				recipient: '$recipient',
				tokenId: '$tokenId'
			},
			totalAmount: { $sum: '$amount' },
			mintCount: { $sum: 1 }
		}
	},
	{
		$project: {
			_id: 0,
			recipient: '$_id.recipient',
			tokenId: '$_id.tokenId',
			totalAmount: 1,
			mintCount: 1
		}
	},
	{
		$sort: {
			recipient: 1, // ascending A → Z
			tokenId: 1 // secondary sort so tokenIds are grouped nicely
		}
	}
]);
