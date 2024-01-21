const db = require('./vwarsDbService.js');
const userService = require('./userService.js');
const vwarsCommandProcessor = require('./vwarsCommandProcessor');
const mockUserRecord = require('./mocks/mockUserRecord'); // You'll create this mock data

jest.mock('./vwarsDbService.js');
jest.mock('./userService.js');

describe('VWARS Command Processor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('processes mine command for a new user', async () => {
    const mockSlashCommandBody = {
      // ... mock data for the slash command body
    };

    // Mocking database response for a new user
    db.getGlobalUser.mockResolvedValue({ Item: null });
    userService.initGlobalUser.mockReturnValue(mockUserRecord);

    const result = await vwarsCommandProcessor.processCommand(mockSlashCommandBody);

    expect(db.getGlobalUser).toHaveBeenCalledWith(/* expected userId */);
    expect(userService.initGlobalUser).toHaveBeenCalledWith(/* expected parameters */);
    expect(db.putGlobalUser).toHaveBeenCalledWith(/* expected user object */);
    expect(result).toEqual(/* expected response object */);
  });

  it('processes mine command for an existing user', async () => {
    const mockSlashCommandBody = {
      // ... mock data for the slash command body
    };

    // Mocking database response for an existing user
    db.getGlobalUser.mockResolvedValue({ Item: mockUserRecord });
    userService.migrateGlobalUser.mockReturnValue(mockUserRecord);

    const result = await vwarsCommandProcessor.processCommand(mockSlashCommandBody);

    expect(db.getGlobalUser).toHaveBeenCalledWith(/* expected userId */);
    expect(userService.migrateGlobalUser).toHaveBeenCalledWith(mockUserRecord);
    expect(result).toEqual(/* expected response object */);
  });

  // More tests for other subcommands like 'smelt', 'construct', etc.
});
