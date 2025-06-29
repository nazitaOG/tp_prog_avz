import { JwtPayload } from "./jwt-payload.interface";

describe('JwtPayloadInterface', () => {
    it('should return true for valid payload', () => {
        const validPayload: JwtPayload = { id: 'Abc123' };
        expect(validPayload).toBeDefined();
        expect(validPayload.id).toBe('Abc123');
    });
});