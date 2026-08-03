import { runIngest } from '@/lib/scrapers/ingest';
import { remoteOkScraper } from '@/lib/scrapers/remoteok';
import { discoverPending } from '@/lib/email-discovery/discover';
import { db } from '@/lib/db';

console.log('--- ingest ---');
console.log(JSON.stringify(await runIngest(remoteOkScraper)));
console.log('--- discovery ---');
console.log(JSON.stringify(await discoverPending(20)));
console.log('--- results ---');
console.log('jobs OPEN :', await db.job.count({ where: { status: 'OPEN', source: { isNot: null } } }));
console.log('jobs DRAFT:', await db.job.count({ where: { status: 'DRAFT', source: { isNot: null } } }));
console.log('shells    :', await db.user.count({ where: { status: 'UNCLAIMED' } }));
console.log('contacts  :', await db.recruiterContact.count());
console.log('contactable:', await db.recruiterContact.count({ where: { contactable: true } }));
console.log('--- sample companies ---');
const s = await db.user.findMany({ where: { status: 'UNCLAIMED' }, take: 4,
  select: { name: true, email: true, recruiterContact: { select: { email: true, contactable: true } } } });
s.forEach(u => console.log(`${u.name} | login=${u.email} | contact=${u.recruiterContact?.email ?? 'none'}`));
await db.$disconnect();
