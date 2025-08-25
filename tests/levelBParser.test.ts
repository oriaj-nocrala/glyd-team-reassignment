import 'reflect-metadata';
import { LevelBDataParser } from '../src/data/levelBParser';
import mock from 'mock-fs';

describe('LevelBDataParser', () => {
  let levelBDataParser: LevelBDataParser;

  beforeEach(() => {
    levelBDataParser = new LevelBDataParser();
  });
  afterEach(() => {
    mock.restore();
  });

  describe('parseEventsFromCSV', () => {
    it('should parse valid event CSV data', async () => {
      const csvData = `id,player_id,ts,event_id,event_instance_id,engagement_kind,points_used
1,1,1672531200,101,1,login,0`;
      mock({ 'data/events.csv': csvData });

      const events = await levelBDataParser.parseEventsFromCSV('data/events.csv');
      expect(events).toHaveLength(1);
      expect(events[0].event_id).toBe(101);
    });
  });

  describe('parseMessagesFromCSV', () => {
    it('should parse valid message CSV data', async () => {
      const csvData = `id,player_id,ts,text_length,is_message_reply,message_reply_to_id
1,1,1672531200,50,False,`;
      mock({ 'data/messages.csv': csvData });

      const messages = await levelBDataParser.parseMessagesFromCSV('data/messages.csv');
      expect(messages).toHaveLength(1);
      expect(messages[0].text_length).toBe(50);
    });
  });

  describe('parseSpendFromCSV', () => {
    it('should parse valid spend CSV data', async () => {
      const csvData = `id,player_id,ts,item_id,item_category,points_spent,is_consumable,is_consumed,consumed_ts
1,1,1672531200,1001,cosmetic,50,False,False,`;
      mock({ 'data/spends.csv': csvData });

      const spends = await levelBDataParser.parseSpendFromCSV('data/spends.csv');
      expect(spends).toHaveLength(1);
      expect(spends[0].item_id).toBe(1001);
    });
  });
});
