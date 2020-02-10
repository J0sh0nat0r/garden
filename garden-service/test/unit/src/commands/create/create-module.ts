/*
 * Copyright (C) 2018-2020 Garden Technologies, Inc. <info@garden.io>
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { expect } from "chai"
import { withDefaultGlobalOpts, TempDirectory, makeTempDir, expectError } from "../../../../helpers"
import { CreateModuleCommand } from "../../../../../src/commands/create/create-module"
import { makeDummyGarden } from "../../../../../src/cli/cli"
import { Garden } from "../../../../../src/garden"
import { basename, join } from "path"
import { pathExists, readFile, writeFile, mkdirp } from "fs-extra"
import { safeLoadAll, safeDump } from "js-yaml"
import { exec } from "../../../../../src/util/util"
import stripAnsi = require("strip-ansi")

describe("CreateModuleCommand", () => {
  const command = new CreateModuleCommand()
  let tmp: TempDirectory
  let garden: Garden

  beforeEach(async () => {
    tmp = await makeTempDir()
    await exec("git", ["init"], { cwd: tmp.path })
    garden = await makeDummyGarden(tmp.path)
  })

  afterEach(async () => {
    await tmp?.cleanup()
  })

  it("should create a module config", async () => {
    const dir = join(tmp.path, "test")
    await mkdirp(dir)

    const { result } = await command.action({
      garden,
      footerLog: garden.log,
      headerLog: garden.log,
      log: garden.log,
      args: {},
      opts: withDefaultGlobalOpts({ dir, interactive: false, name: undefined, type: "exec" }),
    })
    const { name, configPath } = result!

    expect(name).to.equal(basename("test"))
    expect(configPath).to.equal(join(dir, "garden.yml"))
    expect(await pathExists(configPath)).to.be.true

    const parsed = safeLoadAll((await readFile(configPath)).toString())

    expect(parsed).to.eql([
      {
        kind: "Module",
        name,
        type: "exec",
      },
    ])
  })

  it("should optionally set a module name", async () => {
    const { result } = await command.action({
      garden,
      footerLog: garden.log,
      headerLog: garden.log,
      log: garden.log,
      args: {},
      opts: withDefaultGlobalOpts({ dir: tmp.path, interactive: false, name: "test", type: "exec" }),
    })
    const { name, configPath } = result!

    expect(name).to.equal("test")
    const parsed = safeLoadAll((await readFile(configPath)).toString())
    expect(parsed).to.eql([
      {
        kind: "Module",
        name: "test",
        type: "exec",
      },
    ])
  })

  it("should add to an existing garden.yml if one exists", async () => {
    const existing = {
      kind: "Module",
      type: "foo",
      name: "foo",
    }
    await writeFile(join(tmp.path, "garden.yml"), safeDump(existing))

    const { result } = await command.action({
      garden,
      footerLog: garden.log,
      headerLog: garden.log,
      log: garden.log,
      args: {},
      opts: withDefaultGlobalOpts({ dir: tmp.path, interactive: false, name: "test", type: "exec" }),
    })
    const { name, configPath } = result!

    const parsed = safeLoadAll((await readFile(configPath)).toString())
    expect(parsed).to.eql([
      existing,
      {
        kind: "Module",
        name,
        type: "exec",
      },
    ])
  })

  it("should throw if a module with the same name is already in the directory", async () => {
    const existing = {
      kind: "Module",
      name: "test",
      type: "exec",
    }
    const configPath = join(tmp.path, "garden.yml")
    await writeFile(configPath, safeDump(existing))

    await expectError(
      () =>
        command.action({
          garden,
          footerLog: garden.log,
          headerLog: garden.log,
          log: garden.log,
          args: {},
          opts: withDefaultGlobalOpts({ dir: tmp.path, interactive: false, name: "test", type: "exec" }),
        }),
      (err) => expect(stripAnsi(err.message)).to.equal("A Garden module named test already exists in " + configPath)
    )
  })

  it("should throw if target directory doesn't exist", async () => {
    const dir = join(tmp.path, "bla")
    await expectError(
      () =>
        command.action({
          garden,
          footerLog: garden.log,
          headerLog: garden.log,
          log: garden.log,
          args: {},
          opts: withDefaultGlobalOpts({ dir, interactive: false, name: "test", type: "exec" }),
        }),
      (err) => expect(err.message).to.equal(`Path ${dir} does not exist`)
    )
  })

  it("should throw if the module type doesn't exist", async () => {
    await expectError(
      () =>
        command.action({
          garden,
          footerLog: garden.log,
          headerLog: garden.log,
          log: garden.log,
          args: {},
          opts: withDefaultGlobalOpts({ dir: tmp.path, interactive: false, name: undefined, type: "foo" }),
        }),
      (err) => expect(stripAnsi(err.message)).to.equal("Could not find module type foo")
    )
  })
})
