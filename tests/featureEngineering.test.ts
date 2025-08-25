import 'reflect-metadata';
import { FeatureEngineering } from '../src/analysis/featureEngineering';
import { Player, EventRecord, MessageRecord, SpendRecord } from '../src/types';

describe('FeatureEngineering', () => {
  let featureEngineering: FeatureEngineering;

  beforeEach(() => {
    featureEngineering = new FeatureEngineering();
  });
  const samplePlayer: Player = {
    player_id: 1,
    historical_events_participated: 0,
    historical_event_engagements: 0,
    historical_points_earned: 0,
    historical_points_spent: 0,
    historical_messages_sent: 0,
    current_total_points: 0,
    days_active_last_30: 0,
    current_streak_value: 0,
    last_active_ts: '',
    current_team_id: 0,
    current_team_name: '',
  };

  describe('enhancePlayersWithLevelB', () => {
    it('should calculate event quality metrics', () => {
      const events: EventRecord[] = [
        {
          id: 1,
          player_id: 1,
          ts: 1,
          event_id: 1,
          event_instance_id: 1,
          engagement_kind: 'login',
          points_used: 0,
        },
        {
          id: 2,
          player_id: 1,
          ts: 2,
          event_id: 2,
          event_instance_id: 2,
          engagement_kind: 'logout',
          points_used: 10,
        },
      ];
      const enhanced = featureEngineering.enhancePlayersWithLevelB([samplePlayer], events, [], []);
      expect(enhanced[0].event_variety_score).toBeGreaterThan(0);
      expect(enhanced[0].high_value_events_ratio).toBeGreaterThan(0);
    });

    it('should calculate communication metrics', () => {
      const messages: MessageRecord[] = [
        { id: 1, player_id: 1, ts: 1, text_length: 10, is_message_reply: false },
        {
          id: 2,
          player_id: 1,
          ts: 2,
          text_length: 20,
          is_message_reply: true,
          message_reply_to_id: 1,
        },
      ];
      const enhanced = featureEngineering.enhancePlayersWithLevelB(
        [samplePlayer],
        [],
        messages,
        []
      );
      expect(enhanced[0].message_engagement_ratio).toBeGreaterThan(0);
      expect(enhanced[0].conversation_participation).toBeGreaterThan(0);
    });

    it('should calculate spending metrics', () => {
      const spends: SpendRecord[] = [
        {
          id: 1,
          player_id: 1,
          ts: 1,
          item_id: 1,
          item_category: 'a',
          points_spent: 10,
          is_consumable: true,
          is_consumed: true,
        },
        {
          id: 2,
          player_id: 1,
          ts: 2,
          item_id: 2,
          item_category: 'b',
          points_spent: 20,
          is_consumable: false,
          is_consumed: false,
        },
      ];
      const enhanced = featureEngineering.enhancePlayersWithLevelB([samplePlayer], [], [], spends);
      expect(enhanced[0].spending_efficiency).toBeGreaterThan(0);
      expect(enhanced[0].investment_vs_consumption).toBeGreaterThan(0);
    });
  });
});
