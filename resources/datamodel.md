# Vwars Data Modeling

### Access patterns
1. Get guild
2. Get all wars for a guild
3. CRUD war by guild
3. CRUD user by war
4. Get all users for a war

### DynamoDB data model
Table: vwars
| PRIMARY       |  KEY        | ATTRIBUTES                                       |
| ------------- | ----------- | ------------------------------------------------ |
| Partition Key | Sort Key    | Attributes                                       |
| GUILD:ID      |             | theatreCount                                     |
| GUILD:ID      | WAR:ID      | name isActive expiration energyRefresh cycleTime |
| WAR:ID        | USER:ID     | ore city military equipment, etc...              |

