# Vwars Data Modeling

### Access patterns
1. Get guild
2. Get all theatres for a guild
3. CRUD theatre by guild
3. CRUD user by theatre
4. Get all users for a theatre

### DynamoDB data model
Table: vwars
| PRIMARY       |  KEY        | ATTRIBUTES                         |
| ------------- | ----------- | ---------------------------------- |
| Partition Key | Sort Key    | Attributes                         |
| GUILD:ID      |             | theatreCount                       |
| GUILD:ID      | THEATRE:ID  | name isActive expiration cycleTime |
| THEATRE:ID    | USER:ID     | ore city military equipment        |