   assert self.compile_headers
        return self._CompiledHeader(lang, arch) + ".gch"

    def GetObjDependencies(self, sources, objs, arch=None):
        """Given a list of source files and the corresponding object files, returns
    a list of (source, object, gch) tuples, where |gch| is the build-directory
    relative path to the gch file each object file depends on.  |compilable[i]|
    has to be the source file belonging to |objs[i]|."""
        if not self.header or not self.compile_headers:
            return []

        result = []
        for source, obj in zip(sources, objs):
            ext = os.path.splitext(source)[1]
            lang = {
                ".c": "c",
                ".cpp": "cc",
                ".cc": "cc",
                ".cxx": "cc",
                ".m": "m",
                ".mm": "mm",
            }.get(ext, None)
            if lang:
                result.append((source, obj, self._Gch(lang, arch)))
        return result

    def GetPchBuildCommands(self, arch=None):
        """Returns [(path_to_gch, language_flag, language, header)].
    |path_to_gch| and |header| are relative to the build directory.
    """
        if not self.header or not self.compile_headers:
            return []
        return [
            (self._Gch("c", arch), "-x c-header", "c", self.header),
            (self._Gch("cc", arch), "-x c++-header", "cc", self.header),
            (self._Gch("m", arch), "-x objective-c-header", "m", self.header),
            (self._Gch("mm", arch), "-x objective-c++-header", "mm", self.header),
        ]


def XcodeVersion():
    """Returns a tuple of version and build version of installed Xcode."""
    # `xcodebuild -version` output looks like
    #    Xcode 4.6.3
    #    Build version 4H1503
    # or like
    #    Xcode 3.2.6
    #    Component versions: DevToolsCore-1809.0; DevToolsSupport-1806.0
    #    BuildVersion: 10M2518
    # Convert that to ('0463', '4H1503') or ('0326', '10M2518').
    global XCODE_VERSION_CACHE
    if XCODE_VERSION_CACHE:
        return XCODE_VERSION_CACHE
    version = ""
    build = ""
    try:
        version_list = GetStdoutQuiet(["xcodebuild", "-version"]).splitlines()
        # In some circumstances xcodebuild exits 0 but doesn't return
        # the right results; for example, a user on 10.7 or 10.8 with
        # a bogus path set via xcode-select
        # In that case this may be a CLT-only install so fall back to
        # checking that version.
        if len(version_list) < 2:
            raise GypError("xcodebuild returned unexpected results")
        version = version_list[0].split()[-1]  # Last word on first line
        build = version_list[-1].split()[-1]  # Last word on last line
    except GypError:  # Xcode not installed so look for XCode Command Line Tools
        version = CLTVersion()  # macOS Catalina returns 11.0.0.0.1.1567737322
        if not version:
            raise GypError("No Xcode or CLT version detected!")
    # Be careful to convert "4.2.3" to "0423" and "11.0.0" to "1100":
    version = version.split(".")[:3]  # Just major, minor, micro
    version[0] = version[0].zfill(2)  # Add a leading zero if major is one digit
    version = ("".join(version) + "00")[:4]  # Limit to exactly four characters
    XCODE_VERSION_CACHE = (version, build)
    return XCODE_VERSION_CACHE


# This function ported from the logic in Homebrew's CLT version check
def CLTVersion():
    """Returns the version of command-line tools from pkgutil."""
    # pkgutil output looks like
    #   package-id: com.apple.pkg.CLTools_Executables
    #   version: 5.0.1.0.1.1382131676
    #   volume: /
    #   location: /
    #   install-time: 1382544035
    #   groups: com.apple.FindSystemFiles.pkg-group
    #           com.apple.DevToolsBoth.pkg-group
    #           com.apple.DevToolsNonRelocatableShared.pkg-group
    STANDALONE_PKG_ID = "com.apple.pkg.DeveloperToolsCLILeo"
    FROM_XCODE_PKG_ID = "com.apple.pkg.DeveloperToolsCLI"
    MAVERICKS_PKG_ID = "com.apple.pkg.CLTools_Executables"

    regex = re.compile("version: (?P<version>.+)")
    for key in [MAVERICKS_PKG_ID, STANDALONE_PKG_ID, FROM_XCODE_PKG_ID]:
        try:
            output = GetStdout(["/usr/sbin/pkgutil", "--pkg-info", key])
            return re.search(regex, output).groupdict()["version"]
        except GypError:
            continue

    regex = re.compile(r"Command Line Tools for Xcode\s+(?P<version>\S+)")
    try:
        output = GetStdout(["/usr/sbin/softwareupdate", "--history"])
        return re.search(regex, output).groupdict()["version"]
    except GypError:
        return None


def GetStdoutQuiet(cmdlist):
    """Returns the content of standard output returned by invoking |cmdlist|.
  Ignores the stderr.
  Raises |GypError| if the command return with a non-zero return code."""
    job = subprocess.Popen(cmdlist, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    out = job.communicate()[0].decode("utf-8")
    if job.returncode != 0:
        raise GypError("Error %d running %s" % (job.returncode, cmdlist[0]))
    return out.rstrip("\n")


def GetStdout(cmdlist):
    """Returns the content of standard output returned by invoking |cmdlist|.
  Raises |GypError| if the command return with a non-zero return code."""
    job = subprocess.Popen(cmdlist, stdout=subprocess.PIPE)
    out = job.communicate()[0].decode("utf-8")
    if job.returncode != 0:
        sys.stderr.write(out + "\n")
        raise GypError("Error %d running %s" % (job.returncode, cmdlist[0]))
    return out.rstrip("\n")


def MergeGlobalXcodeSettingsToSpec(global_dict, spec):
    """Merges the global xcode_settings dictionary into each configuration of the
  target represented by spec. For keys that are both in the global and the local
  xcode_settings dict, the local key gets precedence.
  """
    # The xcode generator special-cases global xcode_settings and does something
    # that amounts to merging in the global xcode_settings into each local
    # xcode_settings dict.
    global_xcode_settings = global_dict.get("xcode_settings", {})
    for config in spec["configurations"].values():
        if "xcode_settings" in config:
            new_settings = global_xcode_settings.copy()
            new_settings.update(config["xcode_settings"])
            config["xcode_settings"] = new_settings


def IsMacBundle(flavor, spec):
    """Returns if |spec| should be treated as a bundle.

  Bundles are directories with a certain subdirectory structure, instead of
  just a single file. Bundle rules do not produce a binary but also package
  resources into that directory."""
    is_mac_bundle = (
        int(spec.get("mac_xctest_bundle", 0)) != 0
        or int(spec.get("mac_xcuitest_bundle", 0)) != 0
        or (int(spec.get("mac_bundle", 0)) != 0 and flavor == "mac")
    )

    if is_mac_bundle:
        assert spec["type"] != "none", (
            'mac_bundle targets cannot have type none (target "%s")'
            % spec["target_name"]
        )
    return is_mac_bundle


def GetMacBundleResources(product_dir, xcode_settings, resources):
    """Yields (output, resource) pairs for every resource in |resources|.
  Only call this for mac bundle targets.

  Args:
      product_dir: Path to the directory containing the output bundle,
          relative to the build directory.
      xcode_settings: The XcodeSettings of the current target.
      resources: A list of bundle resources, relative to the build directory.
  """
    dest = os.path.join(product_dir, xcode_settings.GetBundleResourceFolder())
    for res in resources:
        output = dest

        # The make generator doesn't support it, so forbid it everywhere
        # to keep the generators more interchangeable.
        assert " " not in res, "Spaces in resource filenames not supported (%s)" % res

        # Split into (path,file).
        res_parts = os.path.split(res)

        # Now split the path into (prefix,maybe.lproj).
        lproj_parts = os.path.split(res_parts[0])
        # If the resource lives in a .lproj bundle, add that to the destination.
        if lproj_parts[1].endswith(".lproj"):
            output = os.path.join(output, lproj_parts[1])

        output = os.path.join(output, res_parts[1])
        # Compiled XIB files are referred to by .nib.
        if output.endswith(".xib"):
            output = os.path.splitext(output)[0] + ".nib"
        # Compiled storyboard files are referred to by .storyboardc.
        if output.endswith(".storyboard"):
            output = os.path.splitext(output)[0] + ".storyboardc"

        yield output, res


def GetMacInfoPlist(product_dir, xcode_settings, gyp_path_to_build_path):
    """Returns (info_plist, dest_plist, defines, extra_env), where:
  * |info_plist| is the source plist path, relative to the
    build directory,
  * |dest_plist| is the destination plist path, relative to the
    build directory,
  * |defines| is a list of preprocessor defines (empty if the plist
    shouldn't be preprocessed,
  * |extra_env| is a dict of env variables that should be exported when
    invoking |mac_tool copy-info-plist|.

  Only call this for mac bundle targets.

  Args:
      product_dir: Path to the directory containing the output bundle,
          relative to the build directory.
      xcode_settings: The XcodeSettings of the current target.
      gyp_to_build_path: A function that converts paths relative to the
          current gyp file to paths relative to the build directory.
  """
    info_plist = xcode_settings.GetPerTargetSetting("INFOPLIST_FILE")
    if not info_plist:
        return None, None, [], {}

    # The make generator doesn't support it, so forbid it everywhere
    # to keep the generators more interchangeable.
    assert " " not in info_plist, (
        "Spaces in Info.plist filenames not supported (%s)" % info_plist
    )

    info_plist = gyp_path_to_build_path(info_plist)

    # If explicitly set to preprocess the plist, invoke the C preprocessor and
    # specify any defines as -D flags.
    if (
        xcode_settings.GetPerTargetSetting("INFOPLIST_PREPROCESS", default="NO")
        == "YES"
    ):
        # Create an intermediate file based on the path.
        defines = shlex.split(
            xcode_settings.GetPerTargetSetting(
                "INFOPLIST_PREPROCESSOR_DEFINITIONS", default=""
            )
        )
    else:
        defines = []

    dest_plist = os.path.join(product_dir, xcode_settings.GetBundlePlistPath())
    extra_env = xcode_settings.GetPerTargetSettings()

    return info_plist, dest_plist, defines, extra_env


def _GetXcodeEnv(
    xcode_settings, built_products_dir, srcroot, configuration, additional_settings=None
):
    """Return the environment variables that Xcode would set. See
  http://developer.apple.com/library/mac/#documentation/DeveloperTools/Reference/XcodeBuildSettingRef/1-Build_Setting_Reference/build_setting_ref.html#//apple_ref/doc/uid/TP40003931-CH3-SW153
  for a full list.

  Args:
      xcode_settings: An XcodeSettings object. If this is None, this function
          returns an empty dict.
      built_products_dir: Absolute path to the built products dir.
      srcroot: Absolute path to the source root.
      configuration: The build configuration name.
      additional_settings: An optional dict with more values to add to the
          result.
  """

    if not xcode_settings:
        return {}

    # This function is considered a friend of XcodeSettings, so let it reach into
    # its implementation details.
    spec = xcode_settings.spec

    # These are filled in on an as-needed basis.
    env = {
        "BUILT_FRAMEWORKS_DIR": built_products_dir,
        "BUILT_PRODUCTS_DIR": built_products_dir,
        "CONFIGURATION": configuration,
        "PRODUCT_NAME": xcode_settings.GetProductName(),
        # For FULL_PRODUCT_NAME see:
        # /Developer/Platforms/MacOSX.platform/Developer/Library/Xcode/Specifications/MacOSX\ Product\ Types.xcspec  # noqa: E501
        "SRCROOT": srcroot,
        "SOURCE_ROOT": "${SRCROOT}",
        # This is not true for static libraries, but currently the env is only
        # written for bundles:
        "TARGET_BUILD_DIR": built_products_dir,
        "TEMP_DIR": "${TMPDIR}",
        "XCODE_VERSION_ACTUAL": XcodeVersion()[0],
    }
    if xcode_settings.GetPerConfigSetting("SDKROOT", configuration):
        env["SDKROOT"] = xcode_settings._SdkPath(configuration)
    else:
        env["SDKROOT"] = ""

    if xcode_settings.mac_toolchain_dir:
        env["DEVELOPER_DIR"] = xcode_settings.mac_toolchain_dir

    if spec["type"] in (
        "executable",
        "static_library",
        "shared_library",
        "loadable_module",
    ):
        env["EXECUTABLE_NAME"] = xcode_settings.GetExecutableName()
        env["EXECUTABLE_PATH"] = xcode_settings.GetExecutablePath()
        env["FULL_PRODUCT_NAME"] = xcode_settings.GetFullProductName()
        mach_o_type = xcode_settings.GetMachOType()
        if mach_o_type:
            env["MACH_O_TYPE"] = mach_o_type
        env["PRODUCT_TYPE"] = xcode_settings.GetProductType()
    if xcode_settings._IsBundle():
        # xcodeproj_file.py sets the same Xcode subfolder value for this as for
        # FRAMEWORKS_FOLDER_PATH so Xcode builds will actually use FFP's value.
        env["BUILT_FRAMEWORKS_DIR"] = os.path.join(
            built_products_dir + os.sep + xcode_settings.GetBundleFrameworksFolderPath()
        )
        env["CONTENTS_FOLDER_PATH"] = xcode_settings.GetBundleContentsFolderPath()
        env["EXECUTABLE_FOLDER_PATH"] = xcode_settings.GetBundleExecutableFolderPath()
        env[
            "UNLOCALIZED_RESOURCES_FOLDER_PATH"
        ] = xcode_settings.GetBundleResourceFolder()
        env["JAVA_FOLDER_PATH"] = xcode_settings.GetBundleJavaFolderPath()
        env["FRAMEWORKS_FOLDER_PATH"] = xcode_settings.GetBundleFrameworksFolderPath()
        env[
            "SHARED_FRAMEWORKS_FOLDER_PATH"
        ] = xcode_settings.GetBundleSharedFrameworksFolderPath()
        env[
            "SHARED_SUPPORT_FOLDER_PATH"
        ] = xcode_settings.GetBundleSharedSupportFolderPath()
        env["PLUGINS_FOLDER_PATH"] = xcode_settings.GetBundlePlugInsFolderPath()
        env["XPCSERVICES_FOLDER_PATH"] = xcode_settings.GetBundleXPCServicesFolderPath()
        env["INFOPLIST_PATH"] = xcode_settings.GetBundlePlistPath()
        env["WRAPPER_NAME"] = xcode_settings.GetWrapperName()

    install_name = xcode_settings.GetInstallName()
    if install_name:
        env["LD_DYLIB_INSTALL_NAME"] = install_name
    install_name_base = xcode_settings.GetInstallNameBase()
    if install_name_base:
        env["DYLIB_INSTALL_NAME_BASE"] = install_name_base
    xcode_version, _ = XcodeVersion()
    if xcode_version >= "0500" and not env.get("SDKROOT"):
        sdk_root = xcode_settings._SdkRoot(configuration)
        if not sdk_root:
            sdk_root = xcode_settings._XcodeSdkPath("")
        if sdk_root is None:
            sdk_root = ""
        env["SDKROOT"] = sdk_root

    if not additional_settings:
        additional_settings = {}
    else:
        # Flatten lists to strings.
        for k in additional_settings:
            if not isinstance(additional_settings[k], str):
                additional_settings[k] = " ".join(additional_settings[k])
    additional_settings.update(env)

    for k in additional_settings:
        additional_settings[k] = _NormalizeEnvVarReferences(additional_settings[k])

    return additional_settings


def _NormalizeEnvVarReferences(str):
    """Takes a string containing variable references in the form ${FOO}, $(FOO),
  or $FOO, and returns a string with all variable references in the form ${FOO}.
  """
    # $FOO -> ${FOO}
    str = re.sub(r"\$([a-zA-Z_][a-zA-Z0-9_]*)", r"${\1}", str)

    # $(FOO) -> ${FOO}
    matches = re.findall(r"(\$\(([a-zA-Z0-9\-_]+)\))", str)
    for match in matches:
        to_replace, variable = match
        assert "$(" not in match, "$($(FOO)) variables not supported: " + match
        str = str.replace(to_replace, "${" + variable + "}")

    return str


def ExpandEnvVars(string, expansions):
    """Expands ${VARIABLES}, $(VARIABLES), and $VARIABLES in string per the
  expansions list. If the variable expands to something that references
  another variable, this variable is expanded as well if it's in env --
  until no variables present in env are left."""
    for k, v in reversed(expansions):
        string = string.replace("${" + k + "}", v)
        string = string.replace("$(" + k + ")", v)
        string = string.replace("$" + k, v)
    return string


def _TopologicallySortedEnvVarKeys(env):
    """Takes a dict |env| whose values are strings that can refer to other keys,
  for example env['foo'] = '$(bar) and $(baz)'. Returns a list L of all keys of
  env such that key2 is after key1 in L if env[key2] refers to env[key1].

  Throws an Exception in case of dependency cycles.
  """
    # Since environment variables can refer to other variables, the evaluation
    # order is important. Below is the logic to compute the dependency graph
    # and sort it.
    regex = re.compile(r"\$\{([a-zA-Z0-9\-_]+)\}")

    def GetEdges(node):
        # Use a definition of edges such that user_of_variable -> used_variable.
        # This happens to be easier in this case, since a variable's
        # definition contains all variables it references in a single string.
        # We can then reverse the result of the topological sort at the end.
        # Since: reverse(topsort(DAG)) = topsort(reverse_edges(DAG))
        matches = {v for v in regex.findall(env[node]) if v in env}
        for dependee in matches:
            assert "${" not in dependee, "Nested variables not supported: " + dependee
        return matches

    try:
        # Topologically sort, and then reverse, because we used an edge definition
        # that's inverted from the expected result of this function (see comment
        # above).
        order = gyp.common.TopologicallySorted(env.keys(), GetEdges)
        order.reverse()
        return order
    except gyp.common.CycleError as e:
        raise GypError(
            "Xcode environment variables are cyclically dependent: " + str(e.nodes)
        )


def GetSortedXcodeEnv(
    xcode_settings, built_products_dir, srcroot, configuration, additional_settings=None
):
    env = _GetXcodeEnv(
        xcode_settings, built_products_dir, srcroot, configuration, additional_settings
    )
    return [(key, env[key]) for key in _TopologicallySortedEnvVarKeys(env)]


def GetSpecPostbuildCommands(spec, quiet=False):
    """Returns the list of postbuilds explicitly defined on |spec|, in a form
  executable by a shell."""
    postbuilds = []
    for postbuild in spec.get("postbuilds", []):
        if not quiet:
            postbuilds.append(
                "echo POSTBUILD\\(%s\\) %s"
                % (spec["target_name"], postbuild["postbuild_name"])
            )
        postbuilds.append(gyp.common.EncodePOSIXShellList(postbuild["action"]))
    return postbuilds


def _HasIOSTarget(targets):
    """Returns true if any target contains the iOS specific key
  IPHONEOS_DEPLOYMENT_TARGET."""
    for target_dict in targets.values():
        for config in target_dict["configurations"].values():
            if config.get("xcode_settings", {}).get("IPHONEOS_DEPLOYMENT_TARGET"):
                return True
    return False


def _AddIOSDeviceConfigurations(targets):
    """Clone all targets and append -iphoneos to the name. Configure these targets
  to build for iOS devices and use correct architectures for those builds."""
    for target_dict in targets.values():
        toolset = target_dict["toolset"]
        configs = target_dict["configurations"]
        for config_name, simulator_config_dict in dict(configs).items():
            iphoneos_config_dict = copy.deepcopy(simulator_config_dict)
            configs[config_name + "-iphoneos"] = iphoneos_config_dict
            configs[config_name + "-iphonesimulator"] = simulator_config_dict
            if toolset == "target":
                simulator_config_dict["xcode_settings"]["SDKROOT"] = "iphonesimulator"
                iphoneos_config_dict["xcode_settings"]["SDKROOT"] = "iphoneos"
    return targets


def CloneConfigurationForDeviceAndEmulator(target_dicts):
    """If |target_dicts| contains any iOS targets, automatically create -iphoneos
  targets for iOS device builds."""
    if _HasIOSTarget(target_dicts):
        return _AddIOSDeviceConfigurations(target_dicts)
    return target_dicts
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               