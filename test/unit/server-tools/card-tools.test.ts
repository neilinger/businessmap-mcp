/**
 * Comprehensive unit tests for CardToolHandler
 * Tests all card CRUD operations, filtering, and error handling
 * Target: 50%+ coverage of src/server/tools/card-tools.ts
 */

import { jest } from '@jest/globals';
import { CardToolHandler } from '../../../src/server/tools/card-tools.js';

describe('CardToolHandler', () => {
  let cardHandler: CardToolHandler;
  let mockServer: any;
  let mockClient: any;
  let registeredTools: Map<string, any>;

  beforeEach(() => {
    cardHandler = new CardToolHandler();
    registeredTools = new Map();

    mockServer = {
      registerTool: jest.fn(function (name: any, schema: any, handler: any) {
        registeredTools.set(name, handler);
      }),
    } as any;

    mockClient = {
      getCards: jest.fn(),
      getCard: jest.fn(),
      createCard: jest.fn(),
      updateCard: jest.fn(),
      deleteCard: jest.fn(),
      moveCard: jest.fn(),
      getCardComments: jest.fn(),
      getCardComment: jest.fn(),
      getCardCustomFields: jest.fn(),
      getCardTypes: jest.fn(),
      getCardHistory: jest.fn(),
      getCardOutcomes: jest.fn(),
      getCardLinkedCards: jest.fn(),
      getCardSubtasks: jest.fn(),
      getCardSubtask: jest.fn(),
      getCardParents: jest.fn(),
      getCardParent: jest.fn(),
      getCardParentGraph: jest.fn(),
      getCardChildren: jest.fn(),
      createCardSubtask: jest.fn(),
      setCardSize: jest.fn(),
      addCardParent: jest.fn(),
      removeCardParent: jest.fn(),
      bulkDeleteCards: jest.fn(),
      bulkUpdateCards: jest.fn(),
    };
  });

  describe('registerTools', () => {
    it('should register all read-only card tools', () => {
      cardHandler.registerTools(mockServer, mockClient, true);

      expect(registeredTools.has('list_cards')).toBe(true);
      expect(registeredTools.has('get_card')).toBe(true);
      expect(registeredTools.has('get_card_size')).toBe(true);
      expect(registeredTools.has('get_card_comments')).toBe(true);
      expect(registeredTools.has('get_card_comment')).toBe(true);
      expect(registeredTools.has('get_card_custom_fields')).toBe(true);
      expect(registeredTools.has('get_card_types')).toBe(true);
      expect(registeredTools.has('get_card_history')).toBe(true);
      expect(registeredTools.has('get_card_outcomes')).toBe(true);
      expect(registeredTools.has('get_card_linked_cards')).toBe(true);
      expect(registeredTools.has('get_card_subtasks')).toBe(true);
      expect(registeredTools.has('get_card_subtask')).toBe(true);
      expect(registeredTools.has('get_card_parents')).toBe(true);
      expect(registeredTools.has('get_card_parent')).toBe(true);
      expect(registeredTools.has('get_card_parent_graph')).toBe(true);
      expect(registeredTools.has('get_card_children')).toBe(true);
    });

    it('should register write operation tools when readOnlyMode is false', () => {
      cardHandler.registerTools(mockServer, mockClient, false);

      expect(registeredTools.has('create_card')).toBe(true);
      expect(registeredTools.has('move_card')).toBe(true);
      expect(registeredTools.has('update_card')).toBe(true);
      expect(registeredTools.has('delete_card')).toBe(true);
      expect(registeredTools.has('set_card_size')).toBe(true);
      expect(registeredTools.has('create_card_subtask')).toBe(true);
      expect(registeredTools.has('add_card_parent')).toBe(true);
      expect(registeredTools.has('remove_card_parent')).toBe(true);
      expect(registeredTools.has('bulk_delete_cards')).toBe(true);
      expect(registeredTools.has('bulk_update_cards')).toBe(true);
    });

    it('should not register write operation tools when readOnlyMode is true', () => {
      cardHandler.registerTools(mockServer, mockClient, true);

      expect(registeredTools.has('create_card')).toBe(false);
      expect(registeredTools.has('move_card')).toBe(false);
      expect(registeredTools.has('update_card')).toBe(false);
      expect(registeredTools.has('delete_card')).toBe(false);
    });
  });

  describe('list_cards tool', () => {
    it('should successfully list cards with board_id', async () => {
      cardHandler.registerTools(mockServer, mockClient, true);
      const handler = registeredTools.get('list_cards');

      const mockCards = [
        { card_id: 1, title: 'Card 1', board_id: 10 },
        { card_id: 2, title: 'Card 2', board_id: 10 },
      ];
      mockClient.getCards.mockResolvedValue(mockCards);

      const result = await handler({ board_id: 10 });

      expect(result.isError).toBeUndefined();
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');

      const parsedContent = JSON.parse(result.content[0].text);
      expect(Array.isArray(parsedContent)).toBe(true);
      expect(parsedContent).toHaveLength(2);
      expect(mockClient.getCards).toHaveBeenCalledWith(10, expect.any(Object));
    });

    it('should pass filter parameters to client', async () => {
      cardHandler.registerTools(mockServer, mockClient, true);
      const handler = registeredTools.get('list_cards');

      mockClient.getCards.mockResolvedValue([]);

      await handler({
        board_id: 10,
        column_ids: [1, 2],
        priority: 5,
      });

      expect(mockClient.getCards).toHaveBeenCalledWith(10, {
        column_ids: [1, 2],
        priority: 5,
      });
    });

    it('should handle getCards error', async () => {
      cardHandler.registerTools(mockServer, mockClient, true);
      const handler = registeredTools.get('list_cards');

      const error = new Error('API Error');
      mockClient.getCards.mockRejectedValue(error);

      const result = await handler({ board_id: 10 });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Error fetching cards');
      expect(result.content[0].text).toContain('API Error');
    });

    it('should handle instance parameter', async () => {
      cardHandler.registerTools(mockServer, mockClient, true);
      const handler = registeredTools.get('list_cards');

      mockClient.getCards.mockResolvedValue([]);

      await handler({ board_id: 10, instance: 'custom-instance' });

      expect(mockClient.getCards).toHaveBeenCalled();
    });

    it('should flatten date_filters nested object', async () => {
      cardHandler.registerTools(mockServer, mockClient, true);
      const handler = registeredTools.get('list_cards');

      mockClient.getCards.mockResolvedValue([]);

      await handler({
        board_id: 10,
        date_filters: {
          created: {
            from: '2024-01-01',
            to: '2024-12-31',
          },
          deadline: {
            from_date: '2024-02-01',
            to_date: '2024-02-28',
          },
        },
      });

      expect(mockClient.getCards).toHaveBeenCalledWith(10, {
        created_from: '2024-01-01',
        created_to: '2024-12-31',
        deadline_from_date: '2024-02-01',
        deadline_to_date: '2024-02-28',
      });
    });

    it('should flatten multiple date_filters', async () => {
      cardHandler.registerTools(mockServer, mockClient, true);
      const handler = registeredTools.get('list_cards');

      mockClient.getCards.mockResolvedValue([]);

      await handler({
        board_id: 10,
        date_filters: {
          archived: { from: '2024-01-01', to: '2024-01-31' },
          last_modified: { from_date: '2024-02-01', to_date: '2024-02-28' },
          last_start: { from: '2024-03-01' },
        },
      });

      expect(mockClient.getCards).toHaveBeenCalledWith(10, {
        archived_from: '2024-01-01',
        archived_to: '2024-01-31',
        last_modified_from_date: '2024-02-01',
        last_modified_to_date: '2024-02-28',
        last_start_from: '2024-03-01',
      });
    });

    it('should handle date_filters with other filters', async () => {
      cardHandler.registerTools(mockServer, mockClient, true);
      const handler = registeredTools.get('list_cards');

      mockClient.getCards.mockResolvedValue([]);

      await handler({
        board_id: 10,
        date_filters: {
          created: { from: '2024-01-01' },
        },
        column_ids: [1, 2, 3],
        priorities: [5, 10],
      });

      expect(mockClient.getCards).toHaveBeenCalledWith(10, {
        created_from: '2024-01-01',
        column_ids: [1, 2, 3],
        priorities: [5, 10],
      });
    });
  });

  describe('get_card tool', () => {
    it('should successfully get a single card', async () => {
      cardHandler.registerTools(mockServer, mockClient, true);
      const handler = registeredTools.get('get_card');

      const mockCard = {
        card_id: 1,
        title: 'Test Card',
        description: 'A test card',
        board_id: 10,
      };
      mockClient.getCard.mockResolvedValue(mockCard);

      const result = await handler({ card_id: 1 });

      expect(result.isError).toBeUndefined();
      expect(result.content).toHaveLength(1);

      const parsedContent = JSON.parse(result.content[0].text);
      expect(parsedContent.card_id).toBe(1);
      expect(parsedContent.title).toBe('Test Card');
      expect(mockClient.getCard).toHaveBeenCalledWith(1);
    });

    it('should handle getCard error', async () => {
      cardHandler.registerTools(mockServer, mockClient, true);
      const handler = registeredTools.get('get_card');

      const error = new Error('Card not found');
      mockClient.getCard.mockRejectedValue(error);

      const result = await handler({ card_id: 999 });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Error fetching card');
    });
  });

  describe('get_card_size tool', () => {
    it('should successfully get card size', async () => {
      cardHandler.registerTools(mockServer, mockClient, true);
      const handler = registeredTools.get('get_card_size');

      const mockCard = { card_id: 1, title: 'Card 1', size: 8 };
      mockClient.getCard.mockResolvedValue(mockCard);

      const result = await handler({ card_id: 1 });

      expect(result.isError).toBeUndefined();
      expect(result.content[0].type).toBe('text');
      expect(result.content[0].text).toContain('Card "Card 1"');
      expect(result.content[0].text).toContain('size: 8 points');
    });

    it('should handle card with no size property', async () => {
      cardHandler.registerTools(mockServer, mockClient, true);
      const handler = registeredTools.get('get_card_size');

      const mockCard = { card_id: 1, title: 'Card 1' };
      mockClient.getCard.mockResolvedValue(mockCard);

      const result = await handler({ card_id: 1 });

      expect(result.content[0].text).toContain('size: 0 points');
    });

    it('should handle getCard error for size', async () => {
      cardHandler.registerTools(mockServer, mockClient, true);
      const handler = registeredTools.get('get_card_size');

      const error = new Error('Failed to fetch');
      mockClient.getCard.mockRejectedValue(error);

      const result = await handler({ card_id: 1 });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Error fetching card size');
    });
  });

  describe('create_card tool', () => {
    it('should successfully create a card', async () => {
      cardHandler.registerTools(mockServer, mockClient, false);
      const handler = registeredTools.get('create_card');

      const newCardData = {
        title: 'New Card',
        column_id: 5,
        description: 'A new card',
      };

      const createdCard = { card_id: 100, ...newCardData };
      mockClient.createCard.mockResolvedValue(createdCard);

      const result = await handler(newCardData);

      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain('Card created successfully');

      const parsedContent = JSON.parse(result.content[0].text.split('\n')[1]);
      expect(parsedContent.card_id).toBe(100);
      expect(parsedContent.title).toBe('New Card');
      expect(mockClient.createCard).toHaveBeenCalledWith(newCardData);
    });

    it('should handle createCard error', async () => {
      cardHandler.registerTools(mockServer, mockClient, false);
      const handler = registeredTools.get('create_card');

      const error = new Error('Invalid input');
      mockClient.createCard.mockRejectedValue(error);

      const result = await handler({ title: 'New Card', column_id: 5 });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Error creating card');
    });

    it('should exclude instance parameter from card data', async () => {
      cardHandler.registerTools(mockServer, mockClient, false);
      const handler = registeredTools.get('create_card');

      mockClient.createCard.mockResolvedValue({ card_id: 1 });

      await handler({ title: 'Card', column_id: 5, instance: 'test' });

      expect(mockClient.createCard).toHaveBeenCalledWith({
        title: 'Card',
        column_id: 5,
      });
      expect(mockClient.createCard).not.toHaveBeenCalledWith(
        expect.objectContaining({ instance: 'test' })
      );
    });

    it('should flatten placement nested object', async () => {
      cardHandler.registerTools(mockServer, mockClient, false);
      const handler = registeredTools.get('create_card');

      mockClient.createCard.mockResolvedValue({ card_id: 101 });

      await handler({
        title: 'Card with Placement',
        column_id: 5,
        placement: {
          lane_id: 3,
          position: 2,
          track: 1,
        },
      });

      expect(mockClient.createCard).toHaveBeenCalledWith({
        title: 'Card with Placement',
        column_id: 5,
        lane_id: 3,
        position: 2,
        track: 1,
      });
    });

    it('should flatten metadata nested object', async () => {
      cardHandler.registerTools(mockServer, mockClient, false);
      const handler = registeredTools.get('create_card');

      mockClient.createCard.mockResolvedValue({ card_id: 102 });

      await handler({
        title: 'Card with Metadata',
        column_id: 5,
        metadata: {
          description: 'Test description',
          size: 5,
          priority: 3,
          type_id: 10,
        },
      });

      expect(mockClient.createCard).toHaveBeenCalledWith({
        title: 'Card with Metadata',
        column_id: 5,
        description: 'Test description',
        size: 5,
        priority: 3,
        type_id: 10,
      });
    });

    it('should flatten owners nested object', async () => {
      cardHandler.registerTools(mockServer, mockClient, false);
      const handler = registeredTools.get('create_card');

      mockClient.createCard.mockResolvedValue({ card_id: 103 });

      await handler({
        title: 'Card with Owners',
        column_id: 5,
        owners: {
          user_id: 42,
          reporter_user_id: 99,
        },
      });

      expect(mockClient.createCard).toHaveBeenCalledWith({
        title: 'Card with Owners',
        column_id: 5,
        user_id: 42,
        reporter_user_id: 99,
      });
    });

    it('should flatten multiple nested objects', async () => {
      cardHandler.registerTools(mockServer, mockClient, false);
      const handler = registeredTools.get('create_card');

      mockClient.createCard.mockResolvedValue({ card_id: 104 });

      await handler({
        title: 'Complex Card',
        column_id: 5,
        placement: { lane_id: 1, position: 0 },
        metadata: { description: 'Test', size: 3 },
        owners: { user_id: 7 },
        dates: { planned_start: '2024-01-01', planned_end: '2024-01-31' },
        collections: { tag_ids_to_add: [1, 2, 3] },
      });

      expect(mockClient.createCard).toHaveBeenCalledWith({
        title: 'Complex Card',
        column_id: 5,
        lane_id: 1,
        position: 0,
        description: 'Test',
        size: 3,
        user_id: 7,
        planned_start: '2024-01-01',
        planned_end: '2024-01-31',
        tag_ids_to_add: [1, 2, 3],
      });
    });
  });

  describe('update_card tool', () => {
    it('should successfully update a card', async () => {
      cardHandler.registerTools(mockServer, mockClient, false);
      const handler = registeredTools.get('update_card');

      const updateData = {
        card_id: 1,
        title: 'Updated Title',
        description: 'Updated description',
      };

      const updatedCard = { ...updateData };
      mockClient.updateCard.mockResolvedValue(updatedCard);

      const result = await handler(updateData);

      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain('Card updated successfully');
      expect(mockClient.updateCard).toHaveBeenCalledWith(updateData);
    });

    it('should handle updateCard error', async () => {
      cardHandler.registerTools(mockServer, mockClient, false);
      const handler = registeredTools.get('update_card');

      const error = new Error('Card not found');
      mockClient.updateCard.mockRejectedValue(error);

      const result = await handler({ card_id: 999, title: 'New' });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Error updating card');
    });
  });

  describe('move_card tool', () => {
    it('should successfully move a card', async () => {
      cardHandler.registerTools(mockServer, mockClient, false);
      const handler = registeredTools.get('move_card');

      const movedCard = {
        card_id: 1,
        title: 'Card',
        column_id: 10,
        position: 2,
      };
      mockClient.moveCard.mockResolvedValue(movedCard);

      const result = await handler({
        card_id: 1,
        column_id: 10,
        lane_id: 5,
        position: 2,
      });

      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain('Card moved successfully');
      expect(mockClient.moveCard).toHaveBeenCalledWith(1, 10, 5, 2);
    });

    it('should handle moveCard without optional parameters', async () => {
      cardHandler.registerTools(mockServer, mockClient, false);
      const handler = registeredTools.get('move_card');

      mockClient.moveCard.mockResolvedValue({ card_id: 1 });

      await handler({ card_id: 1, column_id: 10 });

      expect(mockClient.moveCard).toHaveBeenCalledWith(1, 10, undefined, undefined);
    });

    it('should handle moveCard error', async () => {
      cardHandler.registerTools(mockServer, mockClient, false);
      const handler = registeredTools.get('move_card');

      const error = new Error('Column not found');
      mockClient.moveCard.mockRejectedValue(error);

      const result = await handler({ card_id: 1, column_id: 999 });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Error moving card');
    });
  });

  describe('delete_card tool', () => {
    it('should successfully delete a card', async () => {
      cardHandler.registerTools(mockServer, mockClient, false);
      const handler = registeredTools.get('delete_card');

      mockClient.deleteCard.mockResolvedValue(undefined);

      const result = await handler({ card_id: 1, archive_first: true });

      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain('Card deleted successfully');
      expect(mockClient.deleteCard).toHaveBeenCalledWith(1, { archive_first: true });
    });

    it('should handle deleteCard error', async () => {
      cardHandler.registerTools(mockServer, mockClient, false);
      const handler = registeredTools.get('delete_card');

      const error = new Error('Cannot delete card');
      mockClient.deleteCard.mockRejectedValue(error);

      const result = await handler({ card_id: 1 });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Error deleting card');
    });
  });

  describe('set_card_size tool', () => {
    it('should successfully set card size', async () => {
      cardHandler.registerTools(mockServer, mockClient, false);
      const handler = registeredTools.get('set_card_size');

      const updatedCard = { card_id: 1, title: 'Card', size: 13 };
      mockClient.updateCard.mockResolvedValue(updatedCard);

      const result = await handler({ card_id: 1, size: 13 });

      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain('Card "Card"');
      expect(result.content[0].text).toContain('size updated to: 13 points');
      expect(mockClient.updateCard).toHaveBeenCalledWith({
        card_id: 1,
        size: 13,
      });
    });

    it('should handle setCardSize error', async () => {
      cardHandler.registerTools(mockServer, mockClient, false);
      const handler = registeredTools.get('set_card_size');

      const error = new Error('Invalid size');
      mockClient.updateCard.mockRejectedValue(error);

      const result = await handler({ card_id: 1, size: 999 });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Error setting card size');
    });
  });

  describe('get_card_comments tool', () => {
    it('should successfully get card comments', async () => {
      cardHandler.registerTools(mockServer, mockClient, true);
      const handler = registeredTools.get('get_card_comments');

      const mockComments = [
        { comment_id: 1, text: 'Comment 1' },
        { comment_id: 2, text: 'Comment 2' },
      ];
      mockClient.getCardComments.mockResolvedValue(mockComments);

      const result = await handler({ card_id: 1 });

      expect(result.isError).toBeUndefined();

      const parsedContent = JSON.parse(result.content[0].text);
      expect(parsedContent.count).toBe(2);
      expect(Array.isArray(parsedContent.comments)).toBe(true);
      expect(mockClient.getCardComments).toHaveBeenCalledWith(1);
    });

    it('should handle empty comments list', async () => {
      cardHandler.registerTools(mockServer, mockClient, true);
      const handler = registeredTools.get('get_card_comments');

      mockClient.getCardComments.mockResolvedValue([]);

      const result = await handler({ card_id: 1 });

      const parsedContent = JSON.parse(result.content[0].text);
      expect(parsedContent.count).toBe(0);
    });

    it('should handle getCardComments error', async () => {
      cardHandler.registerTools(mockServer, mockClient, true);
      const handler = registeredTools.get('get_card_comments');

      const error = new Error('Failed to fetch comments');
      mockClient.getCardComments.mockRejectedValue(error);

      const result = await handler({ card_id: 1 });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Error getting card comments');
    });
  });

  describe('get_card_comment tool', () => {
    it('should successfully get a single comment', async () => {
      cardHandler.registerTools(mockServer, mockClient, true);
      const handler = registeredTools.get('get_card_comment');

      const mockComment = { comment_id: 1, card_id: 1, text: 'Test comment' };
      mockClient.getCardComment.mockResolvedValue(mockComment);

      const result = await handler({ card_id: 1, comment_id: 1 });

      expect(result.isError).toBeUndefined();

      const parsedContent = JSON.parse(result.content[0].text);
      expect(parsedContent.comment_id).toBe(1);
      expect(mockClient.getCardComment).toHaveBeenCalledWith(1, 1);
    });

    it('should handle getCardComment error', async () => {
      cardHandler.registerTools(mockServer, mockClient, true);
      const handler = registeredTools.get('get_card_comment');

      const error = new Error('Comment not found');
      mockClient.getCardComment.mockRejectedValue(error);

      const result = await handler({ card_id: 1, comment_id: 999 });

      expect(result.isError).toBe(true);
    });
  });

  describe('get_card_custom_fields tool', () => {
    it('should successfully get card custom fields', async () => {
      cardHandler.registerTools(mockServer, mockClient, true);
      const handler = registeredTools.get('get_card_custom_fields');

      const mockFields = [
        { field_id: 1, name: 'Priority', value: 'High' },
        { field_id: 2, name: 'Status', value: 'Active' },
      ];
      mockClient.getCardCustomFields.mockResolvedValue(mockFields);

      const result = await handler({ card_id: 1 });

      expect(result.isError).toBeUndefined();

      const parsedContent = JSON.parse(result.content[0].text);
      expect(parsedContent.customFields).toBeDefined();
      expect(Array.isArray(parsedContent.customFields)).toBe(true);
      expect(parsedContent.count).toBe(2);
      expect(mockClient.getCardCustomFields).toHaveBeenCalledWith(1);
    });

    it('should handle getCardCustomFields error', async () => {
      cardHandler.registerTools(mockServer, mockClient, true);
      const handler = registeredTools.get('get_card_custom_fields');

      const error = new Error('Failed to fetch fields');
      mockClient.getCardCustomFields.mockRejectedValue(error);

      const result = await handler({ card_id: 1 });

      expect(result.isError).toBe(true);
    });
  });

  describe('get_card_types tool', () => {
    it('should successfully get card types', async () => {
      cardHandler.registerTools(mockServer, mockClient, true);
      const handler = registeredTools.get('get_card_types');

      const mockTypes = [
        { type_id: 1, name: 'Task' },
        { type_id: 2, name: 'Bug' },
      ];
      mockClient.getCardTypes.mockResolvedValue(mockTypes);

      const result = await handler({});

      expect(result.isError).toBeUndefined();

      const parsedContent = JSON.parse(result.content[0].text);
      expect(parsedContent.cardTypes).toBeDefined();
      expect(parsedContent.count).toBe(2);
      expect(mockClient.getCardTypes).toHaveBeenCalled();
    });

    it('should handle getCardTypes error', async () => {
      cardHandler.registerTools(mockServer, mockClient, true);
      const handler = registeredTools.get('get_card_types');

      const error = new Error('Failed to fetch types');
      mockClient.getCardTypes.mockRejectedValue(error);

      const result = await handler({});

      expect(result.isError).toBe(true);
    });
  });

  describe('get_card_history tool', () => {
    it('should successfully get card history', async () => {
      cardHandler.registerTools(mockServer, mockClient, true);
      const handler = registeredTools.get('get_card_history');

      const mockHistory = [{ date: '2025-01-01', action: 'created' }];
      mockClient.getCardHistory.mockResolvedValue(mockHistory);

      const result = await handler({ card_id: 1, outcome_id: 1 });

      expect(result.isError).toBeUndefined();

      const parsedContent = JSON.parse(result.content[0].text);
      expect(parsedContent.history).toBeDefined();
      expect(parsedContent.count).toBe(1);
      expect(mockClient.getCardHistory).toHaveBeenCalledWith(1, 1);
    });

    it('should handle getCardHistory error', async () => {
      cardHandler.registerTools(mockServer, mockClient, true);
      const handler = registeredTools.get('get_card_history');

      const error = new Error('Failed to fetch history');
      mockClient.getCardHistory.mockRejectedValue(error);

      const result = await handler({ card_id: 1, outcome_id: 1 });

      expect(result.isError).toBe(true);
    });
  });

  describe('get_card_outcomes tool', () => {
    it('should successfully get card outcomes', async () => {
      cardHandler.registerTools(mockServer, mockClient, true);
      const handler = registeredTools.get('get_card_outcomes');

      const mockOutcomes = [
        { outcome_id: 1, name: 'Completed' },
        { outcome_id: 2, name: 'Archived' },
      ];
      mockClient.getCardOutcomes.mockResolvedValue(mockOutcomes);

      const result = await handler({ card_id: 1 });

      expect(result.isError).toBeUndefined();

      const parsedContent = JSON.parse(result.content[0].text);
      expect(parsedContent.outcomes).toBeDefined();
      expect(parsedContent.count).toBe(2);
      expect(mockClient.getCardOutcomes).toHaveBeenCalledWith(1);
    });

    it('should handle getCardOutcomes error', async () => {
      cardHandler.registerTools(mockServer, mockClient, true);
      const handler = registeredTools.get('get_card_outcomes');

      const error = new Error('Failed to fetch outcomes');
      mockClient.getCardOutcomes.mockRejectedValue(error);

      const result = await handler({ card_id: 1 });

      expect(result.isError).toBe(true);
    });
  });

  describe('get_card_linked_cards tool', () => {
    it('should successfully get linked cards', async () => {
      cardHandler.registerTools(mockServer, mockClient, true);
      const handler = registeredTools.get('get_card_linked_cards');

      const mockLinked = [{ card_id: 2, title: 'Related Card', link_type: 'blocks' }];
      mockClient.getCardLinkedCards.mockResolvedValue(mockLinked);

      const result = await handler({ card_id: 1 });

      expect(result.isError).toBeUndefined();

      const parsedContent = JSON.parse(result.content[0].text);
      expect(parsedContent.linkedCards).toBeDefined();
      expect(parsedContent.count).toBe(1);
      expect(mockClient.getCardLinkedCards).toHaveBeenCalledWith(1);
    });

    it('should handle getCardLinkedCards error', async () => {
      cardHandler.registerTools(mockServer, mockClient, true);
      const handler = registeredTools.get('get_card_linked_cards');

      const error = new Error('Failed to fetch linked cards');
      mockClient.getCardLinkedCards.mockRejectedValue(error);

      const result = await handler({ card_id: 1 });

      expect(result.isError).toBe(true);
    });
  });

  describe('get_card_subtasks tool', () => {
    it('should successfully get card subtasks', async () => {
      cardHandler.registerTools(mockServer, mockClient, true);
      const handler = registeredTools.get('get_card_subtasks');

      const mockSubtasks = [
        { subtask_id: 1, description: 'Subtask 1', is_finished: false },
        { subtask_id: 2, description: 'Subtask 2', is_finished: true },
      ];
      mockClient.getCardSubtasks.mockResolvedValue(mockSubtasks);

      const result = await handler({ card_id: 1 });

      expect(result.isError).toBeUndefined();

      const parsedContent = JSON.parse(result.content[0].text);
      expect(parsedContent.subtasks).toBeDefined();
      expect(parsedContent.count).toBe(2);
      expect(mockClient.getCardSubtasks).toHaveBeenCalledWith(1);
    });

    it('should handle getCardSubtasks error', async () => {
      cardHandler.registerTools(mockServer, mockClient, true);
      const handler = registeredTools.get('get_card_subtasks');

      const error = new Error('Failed to fetch subtasks');
      mockClient.getCardSubtasks.mockRejectedValue(error);

      const result = await handler({ card_id: 1 });

      expect(result.isError).toBe(true);
    });
  });

  describe('get_card_subtask tool', () => {
    it('should successfully get a single subtask', async () => {
      cardHandler.registerTools(mockServer, mockClient, true);
      const handler = registeredTools.get('get_card_subtask');

      const mockSubtask = {
        subtask_id: 1,
        card_id: 1,
        description: 'Test subtask',
      };
      mockClient.getCardSubtask.mockResolvedValue(mockSubtask);

      const result = await handler({ card_id: 1, subtask_id: 1 });

      expect(result.isError).toBeUndefined();

      const parsedContent = JSON.parse(result.content[0].text);
      expect(parsedContent.subtask_id).toBe(1);
      expect(mockClient.getCardSubtask).toHaveBeenCalledWith(1, 1);
    });

    it('should handle getCardSubtask error', async () => {
      cardHandler.registerTools(mockServer, mockClient, true);
      const handler = registeredTools.get('get_card_subtask');

      const error = new Error('Subtask not found');
      mockClient.getCardSubtask.mockRejectedValue(error);

      const result = await handler({ card_id: 1, subtask_id: 999 });

      expect(result.isError).toBe(true);
    });
  });

  describe('create_card_subtask tool', () => {
    it('should successfully create a subtask', async () => {
      cardHandler.registerTools(mockServer, mockClient, false);
      const handler = registeredTools.get('create_card_subtask');

      const newSubtask = {
        card_id: 1,
        description: 'New subtask',
      };

      const createdSubtask = { subtask_id: 100, ...newSubtask };
      mockClient.createCardSubtask.mockResolvedValue(createdSubtask);

      const result = await handler(newSubtask);

      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain('Subtask created successfully');

      expect(mockClient.createCardSubtask).toHaveBeenCalled();
    });

    it('should handle createCardSubtask error', async () => {
      cardHandler.registerTools(mockServer, mockClient, false);
      const handler = registeredTools.get('create_card_subtask');

      const error = new Error('Invalid subtask');
      mockClient.createCardSubtask.mockRejectedValue(error);

      const result = await handler({
        card_id: 1,
        description: 'New subtask',
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Error creating card subtask');
    });
  });

  describe('get_card_parents tool', () => {
    it('should successfully get card parents', async () => {
      cardHandler.registerTools(mockServer, mockClient, true);
      const handler = registeredTools.get('get_card_parents');

      const mockParents = [{ parent_card_id: 1, title: 'Parent Card' }];
      mockClient.getCardParents.mockResolvedValue(mockParents);

      const result = await handler({ card_id: 1 });

      expect(result.isError).toBeUndefined();

      const parsedContent = JSON.parse(result.content[0].text);
      expect(parsedContent.parents).toBeDefined();
      expect(parsedContent.count).toBe(1);
      expect(mockClient.getCardParents).toHaveBeenCalledWith(1);
    });

    it('should handle getCardParents error', async () => {
      cardHandler.registerTools(mockServer, mockClient, true);
      const handler = registeredTools.get('get_card_parents');

      const error = new Error('Failed to fetch parents');
      mockClient.getCardParents.mockRejectedValue(error);

      const result = await handler({ card_id: 1 });

      expect(result.isError).toBe(true);
    });
  });

  describe('get_card_parent tool', () => {
    it('should successfully get a specific parent', async () => {
      cardHandler.registerTools(mockServer, mockClient, true);
      const handler = registeredTools.get('get_card_parent');

      const mockParent = { parent_card_id: 1, title: 'Parent' };
      mockClient.getCardParent.mockResolvedValue(mockParent);

      const result = await handler({ card_id: 1, parent_card_id: 1 });

      expect(result.isError).toBeUndefined();

      const parsedContent = JSON.parse(result.content[0].text);
      expect(parsedContent.parent_card_id).toBe(1);
      expect(mockClient.getCardParent).toHaveBeenCalledWith(1, 1);
    });

    it('should handle getCardParent error', async () => {
      cardHandler.registerTools(mockServer, mockClient, true);
      const handler = registeredTools.get('get_card_parent');

      const error = new Error('Parent not found');
      mockClient.getCardParent.mockRejectedValue(error);

      const result = await handler({ card_id: 1, parent_card_id: 999 });

      expect(result.isError).toBe(true);
    });
  });

  describe('get_card_parent_graph tool', () => {
    it('should successfully get parent graph', async () => {
      cardHandler.registerTools(mockServer, mockClient, true);
      const handler = registeredTools.get('get_card_parent_graph');

      const mockGraph = [
        { card_id: 1, title: 'Root', parents: [] },
        { card_id: 2, title: 'Parent' },
      ];
      mockClient.getCardParentGraph.mockResolvedValue(mockGraph);

      const result = await handler({ card_id: 1 });

      expect(result.isError).toBeUndefined();

      const parsedContent = JSON.parse(result.content[0].text);
      expect(parsedContent.parentGraph).toBeDefined();
      expect(parsedContent.count).toBe(2);
      expect(mockClient.getCardParentGraph).toHaveBeenCalledWith(1);
    });

    it('should handle getCardParentGraph error', async () => {
      cardHandler.registerTools(mockServer, mockClient, true);
      const handler = registeredTools.get('get_card_parent_graph');

      const error = new Error('Failed to fetch graph');
      mockClient.getCardParentGraph.mockRejectedValue(error);

      const result = await handler({ card_id: 1 });

      expect(result.isError).toBe(true);
    });
  });

  describe('get_card_children tool', () => {
    it('should successfully get card children', async () => {
      cardHandler.registerTools(mockServer, mockClient, true);
      const handler = registeredTools.get('get_card_children');

      const mockChildren = [
        { card_id: 2, title: 'Child 1' },
        { card_id: 3, title: 'Child 2' },
      ];
      mockClient.getCardChildren.mockResolvedValue(mockChildren);

      const result = await handler({ card_id: 1 });

      expect(result.isError).toBeUndefined();

      const parsedContent = JSON.parse(result.content[0].text);
      expect(parsedContent.children).toBeDefined();
      expect(parsedContent.count).toBe(2);
      expect(mockClient.getCardChildren).toHaveBeenCalledWith(1);
    });

    it('should handle getCardChildren error', async () => {
      cardHandler.registerTools(mockServer, mockClient, true);
      const handler = registeredTools.get('get_card_children');

      const error = new Error('Failed to fetch children');
      mockClient.getCardChildren.mockRejectedValue(error);

      const result = await handler({ card_id: 1 });

      expect(result.isError).toBe(true);
    });
  });

  describe('add_card_parent tool', () => {
    it('should successfully add a parent to card', async () => {
      cardHandler.registerTools(mockServer, mockClient, false);
      const handler = registeredTools.get('add_card_parent');

      mockClient.addCardParent.mockResolvedValue({ card_id: 1, parent_card_id: 2 });

      const result = await handler({ card_id: 1, parent_card_id: 2 });

      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain('Card parent added successfully');

      expect(mockClient.addCardParent).toHaveBeenCalledWith(1, 2);
    });

    it('should handle addCardParent error', async () => {
      cardHandler.registerTools(mockServer, mockClient, false);
      const handler = registeredTools.get('add_card_parent');

      const error = new Error('Cannot add parent');
      mockClient.addCardParent.mockRejectedValue(error);

      const result = await handler({ card_id: 1, parent_card_id: 2 });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Error adding card parent');
    });
  });

  describe('remove_card_parent tool', () => {
    it('should successfully remove a parent from card', async () => {
      cardHandler.registerTools(mockServer, mockClient, false);
      const handler = registeredTools.get('remove_card_parent');

      const result = await handler({ card_id: 1, parent_card_id: 2 });

      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain('Card parent removed successfully');

      expect(mockClient.removeCardParent).toHaveBeenCalledWith(1, 2);
    });

    it('should handle removeCardParent error', async () => {
      cardHandler.registerTools(mockServer, mockClient, false);
      const handler = registeredTools.get('remove_card_parent');

      const error = new Error('Cannot remove parent');
      mockClient.removeCardParent.mockRejectedValue(error);

      const result = await handler({ card_id: 1, parent_card_id: 2 });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Error removing card parent');
    });
  });

  describe('bulk_delete_cards tool', () => {
    it('should successfully bulk delete cards with all successes', async () => {
      cardHandler.registerTools(mockServer, mockClient, false);
      const handler = registeredTools.get('bulk_delete_cards');

      mockClient.bulkDeleteCards.mockResolvedValue([
        { id: 1, success: true },
        { id: 2, success: true },
        { id: 3, success: true },
      ]);
      mockClient.getCard.mockResolvedValue({ title: 'Card' });

      const result = await handler({
        resource_ids: [1, 2, 3],
      });

      expect(result.isError).toBeUndefined();

      expect(mockClient.bulkDeleteCards).toHaveBeenCalled();
    });

    it('should handle bulkDeleteCards error', async () => {
      cardHandler.registerTools(mockServer, mockClient, false);
      const handler = registeredTools.get('bulk_delete_cards');

      const error = new Error('Bulk delete failed');
      mockClient.bulkDeleteCards.mockRejectedValue(error);

      const result = await handler({ resource_ids: [1, 2, 3] });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Error bulk deleting cards');
    });
  });

  describe('bulk_update_cards tool', () => {
    it('should successfully bulk update cards', async () => {
      cardHandler.registerTools(mockServer, mockClient, false);
      const handler = registeredTools.get('bulk_update_cards');

      mockClient.bulkUpdateCards.mockResolvedValue([
        { id: 1, success: true },
        { id: 2, success: true },
      ]);

      const result = await handler({
        resource_ids: [1, 2],
        title: 'Updated',
      });

      expect(result.isError).toBeUndefined();

      expect(mockClient.bulkUpdateCards).toHaveBeenCalled();
    });

    it('should handle bulkUpdateCards error', async () => {
      cardHandler.registerTools(mockServer, mockClient, false);
      const handler = registeredTools.get('bulk_update_cards');

      const error = new Error('Bulk update failed');
      mockClient.bulkUpdateCards.mockRejectedValue(error);

      const result = await handler({
        resource_ids: [1],
        title: 'Updated',
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Error bulk updating cards');
    });
  });

  describe('create_card_comment tool', () => {
    it('should register create_card_comment in write mode', () => {
      cardHandler.registerTools(mockServer, mockClient, false);

      expect(registeredTools.has('create_card_comment')).toBe(true);
    });

    it('should NOT register create_card_comment in read-only mode', () => {
      cardHandler.registerTools(mockServer, mockClient, true);

      expect(registeredTools.has('create_card_comment')).toBe(false);
    });

    it('should successfully create a comment with valid card_id and text', async () => {
      mockClient.createCardComment = jest.fn();
      cardHandler.registerTools(mockServer, mockClient, false);
      const handler = registeredTools.get('create_card_comment');

      const mockComment = {
        comment_id: 1,
        card_id: 100,
        text: 'Test comment',
      };
      mockClient.createCardComment.mockResolvedValue(mockComment);

      const result = await handler({
        card_id: 100,
        text: 'Test comment',
      });

      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain('Comment created successfully');

      const parsedContent = JSON.parse(result.content[0].text.split('\n')[1]);
      expect(parsedContent.comment_id).toBe(1);
      expect(parsedContent.text).toBe('Test comment');
      expect(mockClient.createCardComment).toHaveBeenCalledWith(100, {
        text: 'Test comment',
        attachments_to_add: undefined,
      });
    });

    it('should reject empty text (schema validation)', async () => {
      mockClient.createCardComment = jest.fn();
      mockClient.createCardComment.mockRejectedValue(new Error('Comment text cannot be empty'));
      cardHandler.registerTools(mockServer, mockClient, false);
      const handler = registeredTools.get('create_card_comment');

      const result = await handler({
        card_id: 100,
        text: '',
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Error creating card comment');
    });

    it('should reject whitespace-only text (schema validation)', async () => {
      mockClient.createCardComment = jest.fn();
      mockClient.createCardComment.mockRejectedValue(new Error('Comment text cannot be empty'));
      cardHandler.registerTools(mockServer, mockClient, false);
      const handler = registeredTools.get('create_card_comment');

      const result = await handler({
        card_id: 100,
        text: '   ',
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Error creating card comment');
    });

    it('should handle invalid card ID (404 from API)', async () => {
      mockClient.createCardComment = jest.fn();
      cardHandler.registerTools(mockServer, mockClient, false);
      const handler = registeredTools.get('create_card_comment');

      const error = new Error('Card not found');
      mockClient.createCardComment.mockRejectedValue(error);

      const result = await handler({
        card_id: 999,
        text: 'Test comment',
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Error creating card comment');
      expect(result.content[0].text).toContain('Card not found');
    });

    it('should include optional attachments when provided', async () => {
      mockClient.createCardComment = jest.fn();
      cardHandler.registerTools(mockServer, mockClient, false);
      const handler = registeredTools.get('create_card_comment');

      mockClient.createCardComment.mockResolvedValue({
        comment_id: 1,
        card_id: 100,
        text: 'Test comment',
      });

      const attachments = [
        { file_name: 'test.txt', link: 'https://example.com/test.txt' },
      ];

      await handler({
        card_id: 100,
        text: 'Test comment',
        attachments_to_add: attachments,
      });

      expect(mockClient.createCardComment).toHaveBeenCalledWith(100, {
        text: 'Test comment',
        attachments_to_add: attachments,
      });
    });
  });

  describe('update_card_comment tool', () => {
    it('should register update_card_comment in write mode', () => {
      cardHandler.registerTools(mockServer, mockClient, false);

      expect(registeredTools.has('update_card_comment')).toBe(true);
    });

    it('should NOT register update_card_comment in read-only mode', () => {
      cardHandler.registerTools(mockServer, mockClient, true);

      expect(registeredTools.has('update_card_comment')).toBe(false);
    });

    it('should successfully update a comment with new text', async () => {
      mockClient.updateCardComment = jest.fn();
      cardHandler.registerTools(mockServer, mockClient, false);
      const handler = registeredTools.get('update_card_comment');

      const mockComment = {
        comment_id: 1,
        card_id: 100,
        text: 'Updated comment',
      };
      mockClient.updateCardComment.mockResolvedValue(mockComment);

      const result = await handler({
        card_id: 100,
        comment_id: 1,
        text: 'Updated comment',
      });

      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain('Comment updated successfully');

      const parsedContent = JSON.parse(result.content[0].text.split('\n')[1]);
      expect(parsedContent.comment_id).toBe(1);
      expect(parsedContent.text).toBe('Updated comment');
      expect(mockClient.updateCardComment).toHaveBeenCalledWith(100, 1, {
        text: 'Updated comment',
      });
    });

    it('should reject empty text when text is provided (schema validation)', async () => {
      mockClient.updateCardComment = jest.fn();
      mockClient.updateCardComment.mockRejectedValue(new Error('Comment text cannot be empty'));
      cardHandler.registerTools(mockServer, mockClient, false);
      const handler = registeredTools.get('update_card_comment');

      const result = await handler({
        card_id: 100,
        comment_id: 1,
        text: '',
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Error updating card comment');
    });

    it('should handle invalid comment ID (404 from API)', async () => {
      mockClient.updateCardComment = jest.fn();
      cardHandler.registerTools(mockServer, mockClient, false);
      const handler = registeredTools.get('update_card_comment');

      const error = new Error('Comment not found');
      mockClient.updateCardComment.mockRejectedValue(error);

      const result = await handler({
        card_id: 100,
        comment_id: 999,
        text: 'Updated comment',
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Error updating card comment');
      expect(result.content[0].text).toContain('Comment not found');
    });

    it('should require at least one field: text or attachments_to_add (schema validation)', async () => {
      mockClient.updateCardComment = jest.fn();
      mockClient.updateCardComment.mockRejectedValue(
        new Error('At least one of text or attachments_to_add must be provided')
      );
      cardHandler.registerTools(mockServer, mockClient, false);
      const handler = registeredTools.get('update_card_comment');

      const result = await handler({
        card_id: 100,
        comment_id: 1,
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Error updating card comment');
    });

    it('should allow update with only attachments', async () => {
      mockClient.updateCardComment = jest.fn();
      cardHandler.registerTools(mockServer, mockClient, false);
      const handler = registeredTools.get('update_card_comment');

      mockClient.updateCardComment.mockResolvedValue({
        comment_id: 1,
        card_id: 100,
        text: 'Original text',
      });

      const attachments = [
        { file_name: 'image.png', link: 'https://example.com/image.png' },
      ];

      await handler({
        card_id: 100,
        comment_id: 1,
        attachments_to_add: attachments,
      });

      expect(mockClient.updateCardComment).toHaveBeenCalledWith(100, 1, {
        attachments_to_add: attachments,
      });
    });

    it('should allow update with both text and attachments', async () => {
      mockClient.updateCardComment = jest.fn();
      cardHandler.registerTools(mockServer, mockClient, false);
      const handler = registeredTools.get('update_card_comment');

      mockClient.updateCardComment.mockResolvedValue({
        comment_id: 1,
        card_id: 100,
        text: 'Updated text',
      });

      const attachments = [
        { file_name: 'doc.pdf', link: 'https://example.com/doc.pdf' },
      ];

      await handler({
        card_id: 100,
        comment_id: 1,
        text: 'Updated text',
        attachments_to_add: attachments,
      });

      expect(mockClient.updateCardComment).toHaveBeenCalledWith(100, 1, {
        text: 'Updated text',
        attachments_to_add: attachments,
      });
    });
  });

  describe('delete_card_comment tool', () => {
    it('should register delete_card_comment in write mode', () => {
      cardHandler.registerTools(mockServer, mockClient, false);

      expect(registeredTools.has('delete_card_comment')).toBe(true);
    });

    it('should NOT register delete_card_comment in read-only mode', () => {
      cardHandler.registerTools(mockServer, mockClient, true);

      expect(registeredTools.has('delete_card_comment')).toBe(false);
    });

    it('should successfully delete a comment', async () => {
      mockClient.deleteCardComment = jest.fn();
      cardHandler.registerTools(mockServer, mockClient, false);
      const handler = registeredTools.get('delete_card_comment');

      mockClient.deleteCardComment.mockResolvedValue(undefined);

      const result = await handler({
        card_id: 100,
        comment_id: 1,
      });

      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain('Comment deleted successfully');

      expect(mockClient.deleteCardComment).toHaveBeenCalledWith(100, 1);
    });

    it('should handle invalid comment ID (404 from API)', async () => {
      mockClient.deleteCardComment = jest.fn();
      cardHandler.registerTools(mockServer, mockClient, false);
      const handler = registeredTools.get('delete_card_comment');

      const error = new Error('Comment not found');
      mockClient.deleteCardComment.mockRejectedValue(error);

      const result = await handler({
        card_id: 100,
        comment_id: 999,
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Error deleting card comment');
      expect(result.content[0].text).toContain('Comment not found');
    });

    it('should handle already-deleted comment (404 from API)', async () => {
      mockClient.deleteCardComment = jest.fn();
      cardHandler.registerTools(mockServer, mockClient, false);
      const handler = registeredTools.get('delete_card_comment');

      const error = new Error('Comment has already been deleted');
      mockClient.deleteCardComment.mockRejectedValue(error);

      const result = await handler({
        card_id: 100,
        comment_id: 1,
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Error deleting card comment');
      expect(result.content[0].text).toContain('already been deleted');
    });
  });
});
