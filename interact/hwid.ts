import crypto from "crypto";
import * as si from 'systeminformation';

export const genHWID = async () => {
    const osInfo = await si.osInfo();
    const bios = await si.bios();
    const graphics = await si.graphics();
    let graphicsAsLine = '';
    if (graphics && graphics.controllers && graphics.controllers.length > 0) {
        const card = graphics.controllers[0];
        graphicsAsLine +=
            card.vendor +
            card.vendorId +
            card.bus +
            card.model +
            card.vram +
            card.name +
            card.memoryTotal;
    }

    const data = [
        graphicsAsLine,

        osInfo.platform,
        osInfo.distro,
        osInfo.arch,
        osInfo.logofile,
        osInfo.serial,
        osInfo.uefi,

        bios.vendor,
        bios.version,
        bios.releaseDate,
        bios.revision,
    ]

    const createHash = crypto.createHash("md5")

    for (const value of data) {
        try {
            if (typeof value !== 'undefined')
                createHash.update(value.toString());
        } catch (e) {}
    }

    return createHash.digest("hex");
}