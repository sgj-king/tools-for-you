import { Database } from '@vicons/tabler';
import { defineTool } from '../tool';
export const tool = defineTool({
  name: 'SQL 格式化与美化',
  path: '/sql-prettify',
  description: '在线格式化和美化 SQL 查询，支持多种 SQL 方言。',
  keywords: [
    'sql',
    'prettify',
    'beautify',
    'GCP BigQuery',
    'IBM DB2',
    'Apache Hive',
    'MariaDB',
    'MySQL',
    'Couchbase N1QL',
    'Oracle PL/SQL',
    'PostgreSQL',
    'Amazon Redshift',
    'Spark',
    'SQL Server Transact-SQL',
  ],
  component: () => import('./sql-prettify.vue'),
  icon: Database,
});
