import 'reflect-metadata';
import { PaginationDto } from "./pagination.dto";

import { validate } from "class-validator";
import { plainToInstance } from 'class-transformer';

describe('PaginationDto', () => {
    it("should validate with default values", async() =>{
        const dto = new PaginationDto();
        const errors = await validate(dto);
        expect(errors.length).toBe(0);
    })
    it("should validate with valid values", async() =>{
        const dto = new PaginationDto();
        dto.limit = 10;
        dto.offset = 0;
        const errors = await validate(dto);
        expect(errors.length).toBe(0);
    })
    it("should not validate with invalid values", async() =>{
        const dto = new PaginationDto();
        dto.limit = -10;
        dto.offset = -10;
        const errors = await validate(dto);
        expect(errors.length).toBe(2);
    })
    it("should not validate with invalid limit", async() =>{
        const dto = new PaginationDto();
        dto.limit = -10;
        dto.offset = 0;
        const errors = await validate(dto);
        expect(errors.length).toBe(1);
    })
    it("should not validate with invalid offset", async() =>{
        const dto = new PaginationDto();
        dto.limit = 10;
        dto.offset = -10;
        const errors = await validate(dto);
        expect(errors.length).toBe(1);
    })
    it("should convert strings into numbers", async() =>{
        const input ={ limit: "10", offset: "2" };
        const dto = plainToInstance(PaginationDto, input);
        const errors = await validate(dto);
        expect(errors.length).toBe(0);
        expect(dto.limit).toBe(10);
        expect(dto.offset).toBe(2);
    })
});