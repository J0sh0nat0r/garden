/*
 * Copyright (C) 2018-2020 Garden Technologies, Inc. <info@garden.io>
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

// These plugins are always registered
export const supportedPlugins = [
  require("./conftest/conftest"),
  require("./conftest/conftest-container"),
  require("./conftest/conftest-kubernetes"),
  require("./container/container"),
  require("./exec"),
  require("./hadolint/hadolint"),
  require("./kubernetes/kubernetes"),
  require("./kubernetes/local/local"),
  require("./maven-container/maven-container"),
  require("./openfaas/openfaas"),
  require("./terraform/terraform"),
].map((m) => m.gardenPlugin)

// These plugins are always registered
export const builtinPlugins = supportedPlugins.concat(
  [
    require("./google/google-app-engine"),
    require("./google/google-cloud-functions"),
    require("./local/local-google-cloud-functions"),
    require("./npm-package"),
  ].map((m) => m.gardenPlugin)
)
